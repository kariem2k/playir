/*-----------------------------------------------------------
 * http://softwareispoetry.com
 *-----------------------------------------------------------
 * This software is distributed under the Apache 2.0 license.
 *-----------------------------------------------------------
 * File Name   : CCDeviceRenderer.h
 * Description : Windows specific OpenGL renderer.
 *
 * Created     : 05/01/12
 * Author(s)   : Ashraf Samy Hegab
 *-----------------------------------------------------------
 */

#ifndef __CCDEVICERENDERER_H__
#define __CCDEVICERENDERER_H__


#include "Direct3DBase.h"
#include "CCRenderer.h"

class CCTexture2D;


struct VSConstantBuffer
{
	DirectX::XMFLOAT4X4 model;
	DirectX::XMFLOAT4X4 view;
	DirectX::XMFLOAT4X4 projection;
};

struct VertexPositionColourUV
{
	DirectX::XMFLOAT3 position;
	DirectX::XMFLOAT4 colour;
	DirectX::XMFLOAT2 uv;
};

struct PSConstantBuffer
{
	DirectX::XMFLOAT4 colour;
};


class CCDeviceRenderer sealed : public CCRenderer, public Direct3DBase
{
    typedef CCRenderer super;

protected:
	uint m_drawIndex;

protected:
	Microsoft::WRL::ComPtr<ID3D11InputLayout> m_inputLayout;
	Microsoft::WRL::ComPtr<ID3D11VertexShader> m_vertexShader;
	Microsoft::WRL::ComPtr<ID3D11PixelShader> m_pixelShader;

	Microsoft::WRL::ComPtr<ID3D11Buffer> m_vsConstantBuffer;
	VSConstantBuffer m_vsConstantBufferData;

	Microsoft::WRL::ComPtr<ID3D11Buffer> m_psConstantBuffer;
	PSConstantBuffer m_psConstantBufferData;

	struct DrawData
	{
		bool rebuild;

		const float *m_vertices;
		const ushort *m_indices;
		const float *m_uvs;

		Microsoft::WRL::ComPtr<ID3D11Buffer> m_vertexBuffer;
		Microsoft::WRL::ComPtr<ID3D11Buffer> m_indexBuffer;

		int m_vertexSize;
		uint32 m_vertexCount;
		uint32 m_indexCount;



		DrawData()
		{
			m_vertices = NULL;
			m_indices = NULL;
			m_uvs = NULL;

			m_vertexSize = 0;
			m_vertexCount = 0;
			m_indexCount = 0;

			rebuild = false;
		}

		bool buildRequired()
		{
			return m_vertexBuffer == NULL || rebuild;
		}

		void setVertices(const float *vertices, const int size, const int vertexCount);
		void setUVs(const float *vertices);
		void buildVertices(Microsoft::WRL::ComPtr<ID3D11Device1> &m_d3dDevice, Microsoft::WRL::ComPtr<ID3D11DeviceContext1> &m_d3dContext);
		void setIndices(Microsoft::WRL::ComPtr<ID3D11Device1> &m_d3dDevice, const ushort *indices, const uint indexCount);

		void draw(Microsoft::WRL::ComPtr<ID3D11DeviceContext1> &m_d3dContext, GLenum mode, const CCTexture2D *texture);
		void drawIndexed(Microsoft::WRL::ComPtr<ID3D11DeviceContext1> &m_d3dContext, GLenum mode, const CCTexture2D *texture);
	};
	CCList<DrawData> m_drawList;
	const CCTexture2D *currentTexture;
	const float *currentUVs;



public:
    CCDeviceRenderer();
    virtual ~CCDeviceRenderer();

	// Direct3DBase methods.
	virtual void CreateDeviceResources() override;
	virtual void CreateWindowSizeDependentResources() override;

    void bind();

private:
    int getShaderUniformLocation(const char *name);
    bool loadShader(CCShader *shader);

    bool createDefaultFrameBuffer(CCFrameBufferObject &fbo);

    virtual void refreshScreenSize();

	void updateDepthState();

public:
	// Attempt to simulate OpenGL interface
    void GLClear(const bool colour);
	void glViewport(const GLint x, const GLint y, const GLsizei width, const GLsizei height);
	void glScissor(const GLint x, const GLint y, const GLsizei width, const GLsizei height);
	void glEnable(const GLenum cap);
	void glDisable(const GLenum cap);

	void glCullFace(const GLenum mode);

	void glBindTexture(const GLenum mode, const CCTextureName *texture);

	void glDrawArrays(GLenum mode, GLint first, GLsizei count);
	void glDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices);

	void glVertexAttribPointer(uint index, int size, GLenum type, bool normalized, int stride, const void *pointer, const GLsizei count);
	void updateVertexPointer(const uint index, const void *pointer);
	void derefVertexPointer(const uint index, const void *pointer);

	void glUniform4fv(int location, int count, const GLfloat *value);
	void glUniformMatrix4fv(int location, int count, bool transpose, const GLfloat value[4][4]);

	Microsoft::WRL::ComPtr<ID3D11Device1>& getDevice() { return m_d3dDevice; }
};


extern CCDeviceRenderer *gDeviceRenderer;


#endif // __CCDEVICERENDERER_H__
