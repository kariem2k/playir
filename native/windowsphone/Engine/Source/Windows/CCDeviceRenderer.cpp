/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceRenderer.cpp
 *-----------------------------------------------------------
 */

#include "CCDefines.h"
#include "CCDeviceRenderer.h"
#include "CCGLView.h"
#include "BasicReaderWriter.h"
#include "CCTexture2D.h"
#include "CCFileManager.h"


using namespace DirectX;
using namespace Microsoft::WRL;
using namespace Windows::Foundation;
using namespace Windows::UI::Core;


CCDeviceRenderer *gDeviceRenderer = NULL;
static uint totalBuffersCreatedThisFrame = 0;


CCDeviceRenderer::CCDeviceRenderer() :
	m_drawIndex( 0 )
{
	gDeviceRenderer = this;
	currentTexture = NULL;
	currentUVs = NULL;

	Initialize();
}


CCDeviceRenderer::~CCDeviceRenderer()
{
	gDeviceRenderer = NULL;
}


void CCDeviceRenderer::CreateDeviceResources()
{
	Direct3DBase::CreateDeviceResources();

	BasicReaderWriter *basicReaderWriter = new BasicReaderWriter();
	CCText packagedPath;
	Platform::String ^location = Platform::String::Concat(Windows::ApplicationModel::Package::Current->InstalledLocation->Path, "\\");
	packagedPath = GetChars( location );
	{
		CCText filePath = packagedPath.buffer;
		filePath += "SimpleVertexShader.cso";
		Platform::Array<byte>^ fileData = basicReaderWriter->ReadData( GetString( filePath.buffer ) );
		DX::ThrowIfFailed(
			m_d3dDevice->CreateVertexShader(
				fileData->Data,
				fileData->Length,
				nullptr,
				&m_vertexShader
				)
			);

		const D3D11_INPUT_ELEMENT_DESC vertexDesc[] =
		{
			{ "POSITION", 0, DXGI_FORMAT_R32G32B32_FLOAT, 0, D3D11_APPEND_ALIGNED_ELEMENT,  D3D11_INPUT_PER_VERTEX_DATA, 0 },
			{ "COLOR",    0, DXGI_FORMAT_R32G32B32A32_FLOAT, 0, D3D11_APPEND_ALIGNED_ELEMENT, D3D11_INPUT_PER_VERTEX_DATA, 0 },
            { "TEXCOORD", 0, DXGI_FORMAT_R32G32_FLOAT,    0, D3D11_APPEND_ALIGNED_ELEMENT, D3D11_INPUT_PER_VERTEX_DATA, 0 },
		};

		DX::ThrowIfFailed(
			m_d3dDevice->CreateInputLayout(
				vertexDesc,
				ARRAYSIZE(vertexDesc),
				fileData->Data,
				fileData->Length,
				&m_inputLayout
				)
			);
	}
	{
		CCText filePath = packagedPath.buffer;
		filePath += "SimplePixelShader.cso";
		Platform::Array<byte>^ fileData = basicReaderWriter->ReadData( GetString( filePath.buffer ) );
		DX::ThrowIfFailed(
			m_d3dDevice->CreatePixelShader(
				fileData->Data,
				fileData->Length,
				nullptr,
				&m_pixelShader
				)
			);

		{
			CD3D11_BUFFER_DESC constantBufferDesc(sizeof(VSConstantBuffer), D3D11_BIND_CONSTANT_BUFFER);
			DX::ThrowIfFailed(
				m_d3dDevice->CreateBuffer(
					&constantBufferDesc,
					nullptr,
					&m_vsConstantBuffer
					)
				);
		}

		{
			CD3D11_BUFFER_DESC constantBufferDesc(sizeof(PSConstantBuffer), D3D11_BIND_CONSTANT_BUFFER);
			DX::ThrowIfFailed(
				m_d3dDevice->CreateBuffer(
					&constantBufferDesc,
					nullptr,
					&m_psConstantBuffer
					)
				);
		}
	}
	DELETE_POINTER( basicReaderWriter );
}


void CCDeviceRenderer::CreateWindowSizeDependentResources()
{
	Direct3DBase::CreateWindowSizeDependentResources();
}


void CCDeviceRenderer::bind()
{
	super::bind();

	totalBuffersCreatedThisFrame = 0;

	m_d3dContext->OMSetRenderTargets(
		1,
		m_renderTargetView.GetAddressOf(),
		m_depthStencilView.Get()
		);

	m_d3dContext->IASetInputLayout(m_inputLayout.Get());

	m_d3dContext->VSSetShader(
		m_vertexShader.Get(),
		nullptr,
		0
		);

	m_d3dContext->VSSetConstantBuffers(
		0,
		1,
		m_vsConstantBuffer.GetAddressOf()
		);

	m_d3dContext->PSSetConstantBuffers(
		0,
		1,
		m_psConstantBuffer.GetAddressOf()
		);

	m_d3dContext->PSSetShader(
		m_pixelShader.Get(),
		nullptr,
		0
		);
}


void CCDeviceRenderer::clear(const bool colour)
{
	if( colour )
	{
		const float clearColour[] = { 0.0f, 0.0f, 0.0f, 1.000f };
		m_d3dContext->ClearRenderTargetView(
			m_renderTargetView.Get(),
			clearColour
			);
	}

	m_d3dContext->ClearDepthStencilView(
		m_depthStencilView.Get(),
		D3D11_CLEAR_DEPTH,
		1.0f,
		0
		);
}


int CCDeviceRenderer::getShaderUniformLocation(const char *name)
{
	if( name == "u_projectionMatrix" )
	{
		return UNIFORM_PROJECTIONMATRIX;
	}
	else if( name == "u_viewMatrix" )
	{
		return UNIFORM_VIEWMATRIX;
	}
	else if( name == "u_modelMatrix" )
	{
		return UNIFORM_MODELMATRIX;
	}
	else if( name == "u_modelColour" )
	{
		return UNIFORM_MODELCOLOUR;
	}
    return 0;
}


bool CCDeviceRenderer::loadShader(CCShader *shader)
{
    return true;
}


bool CCDeviceRenderer::createDefaultFrameBuffer(CCFrameBufferObject &fbo)
{
    fbo.setFrameBuffer( 0 );
    fbo.width = gView->getWidth();
    fbo.height = gView->getHeight();
	return true;
}


void CCDeviceRenderer::refreshScreenSize()
{
	screenSize.width = gView->getWidth();
	screenSize.height = gView->getHeight();
}


void CCDeviceRenderer::updateDepthState()
{
	D3D11_DEPTH_STENCIL_DESC desc;
	ZeroMemory(&desc, sizeof(desc));

	desc.DepthEnable = ActiveRenderState.depthReadEnabled;
	desc.DepthWriteMask = ActiveRenderState.depthWriteEnabled ? D3D11_DEPTH_WRITE_MASK_ALL : D3D11_DEPTH_WRITE_MASK_ZERO;
	desc.DepthFunc = D3D11_COMPARISON_LESS_EQUAL;

	desc.StencilEnable = false;
	desc.StencilReadMask = D3D11_DEFAULT_STENCIL_READ_MASK;
	desc.StencilWriteMask = D3D11_DEFAULT_STENCIL_WRITE_MASK;

	desc.FrontFace.StencilFunc = D3D11_COMPARISON_ALWAYS;
	desc.FrontFace.StencilPassOp = D3D11_STENCIL_OP_KEEP;
	desc.FrontFace.StencilFailOp = D3D11_STENCIL_OP_KEEP;
	desc.FrontFace.StencilDepthFailOp = D3D11_STENCIL_OP_KEEP;

	desc.BackFace = desc.FrontFace;

	ID3D11DepthStencilState *pResult;
	m_d3dDevice->CreateDepthStencilState(&desc, &pResult);
	m_d3dContext->OMSetDepthStencilState(pResult, 0);
}


void CCDeviceRenderer::glViewport(const GLint x, const GLint y, const GLsizei width, const GLsizei height)
{
	CD3D11_VIEWPORT viewport(
		x,
		y,
		width,
		height
		);

	m_d3dContext->RSSetViewports(1, &viewport);
}


void CCDeviceRenderer::glEnable(const GLenum cap)
{
	if( cap == GL_CULL_FACE )
	{
		glCullFace( ActiveRenderState.cullingType );
	}
	else if( cap == GL_DEPTH_TEST )
	{
		ActiveRenderState.depthReadEnabled = true;
		updateDepthState();
	}
	else if( cap == CC_DEPTH_WRITE )
	{
		ActiveRenderState.depthWriteEnabled = true;
		updateDepthState();
	}
	else if( cap == GL_BLEND )
	{
		D3D11_BLEND_DESC desc;
		ZeroMemory(&desc, sizeof(desc));

		desc.RenderTarget[0].BlendEnable = true;

		desc.RenderTarget[0].SrcBlend  = desc.RenderTarget[0].SrcBlendAlpha  = GL_SRC_ALPHA;
		desc.RenderTarget[0].DestBlend = desc.RenderTarget[0].DestBlendAlpha = GL_ONE_MINUS_SRC_ALPHA;
		desc.RenderTarget[0].BlendOp   = desc.RenderTarget[0].BlendOpAlpha   = D3D11_BLEND_OP_ADD;

		desc.RenderTarget[0].RenderTargetWriteMask = D3D11_COLOR_WRITE_ENABLE_ALL;

		ID3D11BlendState *pResult;
		m_d3dDevice->CreateBlendState(&desc, &pResult);
		m_d3dContext->OMSetBlendState(pResult, nullptr, 0xFFFFFFFF);
	}
	else
	{
		ASSERT( false );
	}
}


void CCDeviceRenderer::glDisable(const GLenum cap)
{
	if( cap == GL_CULL_FACE )
	{
		D3D11_RASTERIZER_DESC desc;
		ZeroMemory(&desc, sizeof(desc));

		desc.CullMode = D3D11_CULL_NONE;
		desc.FillMode = D3D11_FILL_SOLID;
		desc.DepthClipEnable = true;
		//desc.MultisampleEnable = true;

		ID3D11RasterizerState *pResult;
		m_d3dDevice->CreateRasterizerState(&desc, &pResult);
		m_d3dContext->RSSetState(pResult);
	}
	else if( cap == GL_DEPTH_TEST )
	{
		ActiveRenderState.depthReadEnabled = false;
		updateDepthState();
	}
	else if( cap == CC_DEPTH_WRITE )
	{
		ActiveRenderState.depthWriteEnabled = false;
		updateDepthState();
	}
	else if( cap == GL_BLEND )
	{
		D3D11_BLEND_DESC desc;
		ZeroMemory(&desc, sizeof(desc));

		desc.RenderTarget[0].BlendEnable = false;

		desc.RenderTarget[0].SrcBlend  = desc.RenderTarget[0].SrcBlendAlpha  = GL_SRC_ALPHA;
		desc.RenderTarget[0].DestBlend = desc.RenderTarget[0].DestBlendAlpha = GL_ONE_MINUS_SRC_ALPHA;
		desc.RenderTarget[0].BlendOp   = desc.RenderTarget[0].BlendOpAlpha   = D3D11_BLEND_OP_ADD;

		desc.RenderTarget[0].RenderTargetWriteMask = D3D11_COLOR_WRITE_ENABLE_ALL;

		ID3D11BlendState *pResult;
		m_d3dDevice->CreateBlendState(&desc, &pResult);
		m_d3dContext->OMSetBlendState(pResult, nullptr, 0xFFFFFFFF);
	}
	else
	{
		ASSERT( false );
	}
}


void CCDeviceRenderer::glCullFace(const GLenum mode)
{
	D3D11_RASTERIZER_DESC desc;
	ZeroMemory(&desc, sizeof(desc));

	desc.CullMode = mode == GL_FRONT ? D3D11_CULL_BACK : D3D11_CULL_FRONT;
	desc.FillMode = D3D11_FILL_SOLID;
	desc.DepthClipEnable = true;
	//desc.MultisampleEnable = true;

	ID3D11RasterizerState *pResult;
	m_d3dDevice->CreateRasterizerState(&desc, &pResult);
    m_d3dContext->RSSetState(pResult);
}


void CCDeviceRenderer::glBindTexture(const GLenum mode, const CCTextureName *texture)
{
	const CCTexture2D *Texture2D = static_cast<const CCTexture2D*>( texture );
	if( Texture2D != NULL )
	{
		currentTexture = Texture2D;
	}
}


void CCDeviceRenderer::glDrawArrays(GLenum mode, GLint first, GLsizei count)
{
	DrawData *drawData = m_drawList.list[m_drawIndex];

	if( drawData->m_uvs != currentUVs )
	{
		drawData->setUVs( currentUVs );
	}

	if( drawData->buildRequired() )
	{
		drawData->buildVertices( m_d3dDevice, m_d3dContext );
	}

	drawData->draw( m_d3dContext, mode, currentTexture );
}


void CCDeviceRenderer::glDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices)
{
	DrawData *drawData = m_drawList.list[m_drawIndex];

	if( drawData->m_uvs != currentUVs )
	{
		drawData->setUVs( currentUVs );
	}

	if( drawData->buildRequired() )
	{
		drawData->buildVertices( m_d3dDevice, m_d3dContext );
	}

	if( drawData->m_indices != indices )
	{
		drawData->setIndices( m_d3dDevice, (const ushort*)indices, count );
	}

	drawData->drawIndexed( m_d3dContext, mode, currentTexture );
}


void CCDeviceRenderer::glVertexAttribPointer(uint index, int size, GLenum type, bool normalized, int stride, const void *pointer, const GLsizei count)
{
	if( index == ATTRIB_VERTEX )
	{
		const float *vertices = (const float*)pointer;

		DrawData *drawData = NULL;
		for( int i=0; i<m_drawList.length; ++i )
		{
			DrawData *drawDataItr = m_drawList.list[i];
			if( drawDataItr->m_vertices == vertices )
			{
				m_drawIndex = i;
				drawData = drawDataItr;
				if( drawData->m_vertexCount != count )
				{
					drawData->setVertices( vertices, size, count );
				}
				break;
			}
		}

		if( drawData == NULL )
		{
			drawData = new DrawData();
			drawData->setVertices( vertices, size, count );

			m_drawIndex = m_drawList.length;
			m_drawList.add( drawData );

#ifdef DEBUGON
			CCText debug;
			debug = "CCDeviceRenderer::glVertexAttribPointer()::DrawList size ";
			debug += m_drawList.length;
			debug += "\n";
			DEBUGLOG( debug.buffer );
#endif
		}
	}
	else if( index == ATTRIB_TEXCOORD )
	{
		currentUVs = (const float*)pointer;
	}
}


void CCDeviceRenderer::updateVertexPointer(const uint index, const void *pointer)
{
	if( index == ATTRIB_VERTEX )
	{
		const float *vertices = (const float*)pointer;

		for( int i=0; i<m_drawList.length; ++i )
		{
			DrawData *drawData = m_drawList.list[i];
			if( drawData->m_vertices == vertices )
			{
				drawData->m_vertexCount = 0;
				break;
			}
		}
	}
}


void CCDeviceRenderer::derefVertexPointer(const uint index, const void *pointer)
{
	if( index == ATTRIB_VERTEX )
	{
		const float *vertices = (const float*)pointer;

		for( int i=0; i<m_drawList.length; ++i )
		{
			DrawData *drawData = m_drawList.list[i];
			if( drawData->m_vertices == vertices )
			{
				m_drawIndex = 0;
				m_drawList.remove( drawData );
				delete drawData;

#ifdef DEBUGON
				CCText debug;
				debug = "CCDeviceRenderer::derefVertexPointer()::DrawList size ";
				debug += m_drawList.length;
				debug += "\n";
				DEBUGLOG( debug.buffer );
#endif
				break;
			}
		}
	}
}


void CCDeviceRenderer::glUniform4fv(int location, int count, const GLfloat *value)
{
	const GLint *uniforms = getShader()->uniforms;
	if( location == uniforms[UNIFORM_MODELCOLOUR] )
	{
		m_psConstantBufferData.colour = XMFLOAT4(value);

		m_d3dContext->UpdateSubresource(
			m_psConstantBuffer.Get(),
			0,
			NULL,
			&m_psConstantBufferData,
			0,
			0
			);
	}
}


void CCDeviceRenderer::glUniformMatrix4fv(int location, int count, bool transpose, const GLfloat value[4][4])
{
	const GLint *uniforms = getShader()->uniforms;
	if( location == uniforms[UNIFORM_PROJECTIONMATRIX] )
	{
		const CCMatrix &viewMatrix = CCCameraBase::CurrentCamera->getViewMatrix();
		const CCMatrix &modelMatrix = CCCameraBase::CurrentCamera->pushedMatrix[CCCameraBase::CurrentCamera->currentPush];
		const CCMatrix &projectionMatrix = CCCameraBase::CurrentCamera->getProjectionMatrix();

		XMMATRIX model, view, projection;

		{
			float data[4][4];
			for( int x=0; x<4; ++x )
			{
				for( int y=0; y<4; ++y )
				{
					data[y][x] = projectionMatrix.m[x][y];
				}
			}
			projection =	XMMATRIX( data[0][0], data[0][1], data[0][2], data[0][3],
									  data[1][0], data[1][1], data[1][2], data[1][3],
									  data[2][0], data[2][1], data[2][2], data[2][3],
									  data[3][0], data[3][1], data[3][2], data[3][3] );
		}
		{
			float data[4][4];
			for( int x=0; x<4; ++x )
			{
				for( int y=0; y<4; ++y )
				{
					data[y][x] = viewMatrix.m[x][y];
				}
			}
			view =	XMMATRIX( data[0][0], data[0][1], data[0][2], data[0][3],
							  data[1][0], data[1][1], data[1][2], data[1][3],
							  data[2][0], data[2][1], data[2][2], data[2][3],
							  data[3][0], data[3][1], data[3][2], data[3][3] );
		}
		{
			float data[4][4];
			for( int x=0; x<4; ++x )
			{
				for( int y=0; y<4; ++y )
				{
					data[y][x] = modelMatrix.m[x][y];
				}
			}
			model =	XMMATRIX( data[0][0], data[0][1], data[0][2], data[0][3],
							  data[1][0], data[1][1], data[1][2], data[1][3],
							  data[2][0], data[2][1], data[2][2], data[2][3],
							  data[3][0], data[3][1], data[3][2], data[3][3] );
		}

		XMStoreFloat4x4(&m_vsConstantBufferData.view, view );
		XMStoreFloat4x4(&m_vsConstantBufferData.model, model);
		XMStoreFloat4x4(&m_vsConstantBufferData.projection, projection);

		m_d3dContext->UpdateSubresource(
			m_vsConstantBuffer.Get(),
			0,
			NULL,
			&m_vsConstantBufferData,
			0,
			0
			);
	}
}


void CCDeviceRenderer::DrawData::setVertices(const float *vertices, const int size, const int vertexCount)
{
	rebuild = true;
	m_vertices = vertices;
	m_vertexSize = size;
	m_vertexCount = vertexCount;
}


void CCDeviceRenderer::DrawData::setUVs(const float *uvs)
{
	rebuild = true;
	m_uvs = uvs;
}


void CCDeviceRenderer::DrawData::buildVertices(Microsoft::WRL::ComPtr<ID3D11Device1> &m_d3dDevice,
											   Microsoft::WRL::ComPtr<ID3D11DeviceContext1> &m_d3dContext)
{
	if( m_vertexBuffer == NULL )
	{
		if( totalBuffersCreatedThisFrame++ > 10 )
		{
			//return;
		}

		VertexPositionColourUV *vertexData = new VertexPositionColourUV[m_vertexCount];
		for( int i=0; i<m_vertexCount; ++i )
		{
			const int vertexIndex = i*m_vertexSize;
			XMFLOAT3 position = XMFLOAT3( m_vertices[vertexIndex+0],  m_vertices[vertexIndex+1],  m_vertices[vertexIndex+2] );
			vertexData[i].position = position;
			vertexData[i].colour = XMFLOAT4(1.0f, 1.0f, 1.0f, 1.0f);

			const int uvIndex = i*2;
			if( m_uvs != NULL )
			{
				vertexData[i].uv = XMFLOAT2(m_uvs[uvIndex+0], m_uvs[uvIndex+1]);
			}
		}

		D3D11_SUBRESOURCE_DATA vertexBufferData = {0};
			vertexBufferData.pSysMem = vertexData;
			vertexBufferData.SysMemPitch = 0;
			vertexBufferData.SysMemSlicePitch = 0;
			CD3D11_BUFFER_DESC vertexBufferDesc(m_vertexCount * sizeof(VertexPositionColourUV), D3D11_BIND_VERTEX_BUFFER);
			vertexBufferDesc.Usage = D3D11_USAGE_DYNAMIC;
			vertexBufferDesc.CPUAccessFlags = D3D11_CPU_ACCESS_WRITE;

			DX::ThrowIfFailed(
				m_d3dDevice->CreateBuffer(
					&vertexBufferDesc,
					&vertexBufferData,
					&m_vertexBuffer
					)
				);

		delete[] vertexData;
	}

	// Edit our vertex buffer
	else
	{
		D3D11_MAPPED_SUBRESOURCE mapped;
		DX::ThrowIfFailed(
			m_d3dContext->Map( m_vertexBuffer.Get(), 0, D3D11_MAP::D3D11_MAP_WRITE_DISCARD, 0, &mapped )
			);

		VertexPositionColourUV *vertexData = (VertexPositionColourUV*)mapped.pData;
		for( int i=0; i<m_vertexCount; ++i )
		{
			const int vertexIndex = i*m_vertexSize;
			XMFLOAT3 position = XMFLOAT3( m_vertices[vertexIndex+0],  m_vertices[vertexIndex+1],  m_vertices[vertexIndex+2] );
			vertexData[i].position = position;
			vertexData[i].colour = XMFLOAT4(1.0f, 1.0f, 1.0f, 1.0f);

			const int uvIndex = i*2;
			if( m_uvs != NULL )
			{
				vertexData[i].uv = XMFLOAT2(m_uvs[uvIndex+0], m_uvs[uvIndex+1]);
			}
		}

		m_d3dContext->Unmap( m_vertexBuffer.Get(), 0 );
	}
}


void CCDeviceRenderer::DrawData::setIndices(Microsoft::WRL::ComPtr<ID3D11Device1> &m_d3dDevice, const ushort *indices, const uint indexCount)
{
	m_indices = indices;
	m_indexCount = indexCount;

	D3D11_SUBRESOURCE_DATA indexBufferData = {0};
	indexBufferData.pSysMem = indices;
	indexBufferData.SysMemPitch = 0;
	indexBufferData.SysMemSlicePitch = 0;
	CD3D11_BUFFER_DESC indexBufferDesc(indexCount * sizeof(ushort), D3D11_BIND_INDEX_BUFFER);
	DX::ThrowIfFailed(
		m_d3dDevice->CreateBuffer(
			&indexBufferDesc,
			&indexBufferData,
			&m_indexBuffer
			)
		);
}


void CCDeviceRenderer::DrawData::draw(Microsoft::WRL::ComPtr<ID3D11DeviceContext1> &m_d3dContext, GLenum mode, const CCTexture2D *texture)
{
	if( m_vertexBuffer == NULL )
	{
		return;
	}

	UINT stride = sizeof(VertexPositionColourUV);
	UINT offset = 0;
	m_d3dContext->IASetVertexBuffers(
		0,
		1,
		m_vertexBuffer.GetAddressOf(),
		&stride,
		&offset
		);

	if( texture != NULL )
	{
		ID3D11ShaderResourceView *textureView = texture->getTextureView();
		m_d3dContext->PSSetShaderResources(
			0,
			1,
			&textureView
			);

		ID3D11SamplerState *textureSampler = texture->getSampler();
		m_d3dContext->PSSetSamplers(
			0,
			1,
			&textureSampler
			);
	}

	if( mode == GL_TRIANGLE_STRIP )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
	}
	else if( mode == GL_TRIANGLES )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
	}
	else if( mode == GL_LINE_STRIP )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_LINESTRIP);
	}
	else if( mode == GL_LINES )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_LINELIST);
	}
	else
	{
		ASSERT( false );
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
	}

	m_d3dContext->Draw(
		m_vertexCount,
		0
		);
}


void CCDeviceRenderer::DrawData::drawIndexed(Microsoft::WRL::ComPtr<ID3D11DeviceContext1> &m_d3dContext, GLenum mode, const CCTexture2D *texture)
{
	if( m_vertexBuffer == NULL )
	{
		return;
	}

	if( m_indexBuffer == NULL )
	{
		return;
	}

	UINT stride = sizeof(VertexPositionColourUV);
	UINT offset = 0;
	m_d3dContext->IASetVertexBuffers(
		0,
		1,
		m_vertexBuffer.GetAddressOf(),
		&stride,
		&offset
		);

	m_d3dContext->IASetIndexBuffer(
		m_indexBuffer.Get(),
		DXGI_FORMAT_R16_UINT,
		0
		);

	if( texture != NULL )
	{
		ID3D11ShaderResourceView *textureView = texture->getTextureView();
		m_d3dContext->PSSetShaderResources(
			0,
			1,
			&textureView
			);

		ID3D11SamplerState *textureSampler = texture->getSampler();
		m_d3dContext->PSSetSamplers(
			0,
			1,
			&textureSampler
			);
	}

	if( mode == GL_TRIANGLE_STRIP )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
	}
	else if( mode == GL_TRIANGLES )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLELIST);
	}
	else if( mode == GL_LINE_STRIP )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_LINESTRIP);
	}
	else if( mode == GL_LINES )
	{
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_LINELIST);
	}
	else
	{
		ASSERT( false );
		m_d3dContext->IASetPrimitiveTopology(D3D11_PRIMITIVE_TOPOLOGY_TRIANGLESTRIP);
	}

	m_d3dContext->DrawIndexed(
		m_indexCount,
		0,
		0
		);
}



void CCSetModelViewProjectionMatrix()
{
	// Temporarily use MVP token to start the VS set constants proecess
	if( CCCameraBase::CurrentCamera != NULL )
	{
		CCMatrix &viewMatrix = CCCameraBase::CurrentCamera->getViewMatrix();
		GLUniformMatrix4fv( UNIFORM_PROJECTIONMATRIX, 1, GL_FALSE, viewMatrix.m );
	}
}


// Attempt to simulate OpenGL interface
void GLViewport(const GLint x, const GLint y, const GLsizei width, const GLsizei height)
{
	gDeviceRenderer->glViewport( x, y, width, height );
}


void GLEnable(const GLenum cap)
{
	gDeviceRenderer->glEnable( cap );
}


void GLDisable(const GLenum cap)
{
	gDeviceRenderer->glDisable( cap );
}


void GLCullFace(const GLenum mode)
{
	gDeviceRenderer->glCullFace( mode );
}


void GLBindTexture(const GLenum mode, const CCTextureName *texture)
{
	gDeviceRenderer->glBindTexture( mode, texture );
}


void GLDrawArrays(GLenum mode, GLint first, GLsizei count)
{
	gDeviceRenderer->glDrawArrays(mode, first, count);
}


void GLDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices)
{
	gDeviceRenderer->glDrawElements(mode, count, type, indices);
}


void GLVertexAttribPointer(uint index, int size, GLenum type, bool normalized, int stride, const void *pointer, const GLsizei count)
{
	gDeviceRenderer->glVertexAttribPointer(index, size, type, normalized, stride, pointer, count);
}


void GLUniform3fv(int location, int count, const GLfloat *value)
{
}


void GLUniform4fv(int location, int count, const GLfloat *value)
{
	gDeviceRenderer->glUniform4fv( location, count, value );
}


void GLUniformMatrix4fv(int location, int count, bool transpose, const GLfloat value[4][4])
{
	gDeviceRenderer->glUniformMatrix4fv( location, count, transpose, value );
}