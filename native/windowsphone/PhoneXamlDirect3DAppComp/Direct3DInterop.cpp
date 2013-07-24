#include "pch.h"
#include "Direct3DInterop.h"
#include "Direct3DContentProvider.h"

using namespace Windows::Foundation;
using namespace Windows::UI::Core;
using namespace Microsoft::WRL;
using namespace Windows::Phone::Graphics::Interop;
using namespace Windows::Phone::Input::Interop;
using namespace Windows::UI::Input;

#include <string.h>
#include <sstream>
using namespace std;


#include "CCDefines.h"
#include "CCAppManager.h"
#include "CCDeviceRenderer.h"
#include "CCDeviceControls.h"
#include "CCDeviceURLManager.h"


namespace PhoneXamlDirect3DAppComp
{

Direct3DInterop::Direct3DInterop(Platform::String^ token)
{
	if( token != nullptr && token->Length() > 0 )
	{
		CLIENT_ID = GetChars( token );
	}
}

IDrawingSurfaceContentProvider^ Direct3DInterop::CreateContentProvider()
{
	ComPtr<Direct3DContentProvider> provider = Make<Direct3DContentProvider>(this);
	return reinterpret_cast<IDrawingSurfaceContentProvider^>(provider.Detach());
}

// IDrawingSurfaceManipulationHandler
void Direct3DInterop::SetManipulationHost(DrawingSurfaceManipulationHost^ manipulationHost)
{
	manipulationHost->PointerPressed += ref new TypedEventHandler<DrawingSurfaceManipulationHost^, PointerEventArgs^>(this, &Direct3DInterop::OnPointerPressed);
	manipulationHost->PointerMoved += ref new TypedEventHandler<DrawingSurfaceManipulationHost^, PointerEventArgs^>(this, &Direct3DInterop::OnPointerMoved);
	manipulationHost->PointerReleased += ref new TypedEventHandler<DrawingSurfaceManipulationHost^, PointerEventArgs^>(this, &Direct3DInterop::OnPointerReleased);
}

void Direct3DInterop::RenderResolution::set(Windows::Foundation::Size renderResolution)
{
	if (renderResolution.Width  != m_renderResolution.Width ||
		renderResolution.Height != m_renderResolution.Height)
	{
		m_renderResolution = renderResolution;

		if (gDeviceRenderer != NULL)
		{
			gDeviceRenderer->UpdateForRenderResolutionChange(m_renderResolution.Width, m_renderResolution.Height);
			RecreateSynchronizedTexture();
		}
	}
}

// Event Handlers
void Direct3DInterop::OnPointerPressed(DrawingSurfaceManipulationHost^ sender, PointerEventArgs^ args)
{
#ifdef DEBUGON
	ostringstream sstream;
	sstream << "Pressed at: " << "X: " << args->CurrentPoint->Position.X << " Y: " << args->CurrentPoint->Position.Y << "\n";
	string s = sstream.str();
	DEBUGLOG(s.c_str());
#endif

    PointerPoint^ point = args->CurrentPoint;
	if( gEngine != NULL )
	{
		CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
		controls->touchBegin( point );
	}
}

void Direct3DInterop::OnPointerMoved(DrawingSurfaceManipulationHost^ sender, PointerEventArgs^ args)
{
#ifdef DEBUGON
	//ostringstream sstream;
	//sstream << "Moved at: " << "X: " << args->CurrentPoint->Position.X << " Y: " << args->CurrentPoint->Position.Y << "\n";
	//string s = sstream.str();
	//DEBUGLOG(s.c_str());
#endif

    PointerPoint^ point = args->CurrentPoint;
	if( gEngine != NULL )
	{
		CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
		controls->touchMove( point );
	}
}

void Direct3DInterop::OnPointerReleased(DrawingSurfaceManipulationHost^ sender, PointerEventArgs^ args)
{
#ifdef DEBUGON
	ostringstream sstream;
	sstream << "Released at: " << "X: " << args->CurrentPoint->Position.X << " Y: " << args->CurrentPoint->Position.Y << "\n";
	string s = sstream.str();
	DEBUGLOG(s.c_str());
#endif

    PointerPoint^ point = args->CurrentPoint;
	if( gEngine != NULL )
	{
		CCDeviceControls *controls = (CCDeviceControls*)gEngine->controls;
		controls->touchEnd( point );
	}
}

void Direct3DInterop::OnKeyUp(Platform::String^ key)
{
	if( gEngine != NULL )
	{
		const char *cKey = GetChars( key );

        for( int i=0; i<CCAppManager::KeyboardUpdateCallbacks.length; ++i )
        {
            CCTextCallback *callback = CCAppManager::KeyboardUpdateCallbacks.list[i];
            callback->add( cKey, 0 );
            CCLAMBDA_1_UNSAFE( ReRunCallback, CCTextCallback*, callback,
            {
                // Make sure our callback is still valid - Improve by using LazyCallbacks
                for( int i=0; i<CCAppManager::KeyboardUpdateCallbacks.length; ++i )
                {
                    if( callback == CCAppManager::KeyboardUpdateCallbacks.list[i] )
                    {
                        callback->safeRun();
                        break;
                    }
                }
            });
            gEngine->nativeToEngineThread( new ReRunCallback( callback ) );
        }
    }
}

// Interface With Direct3DContentProvider
HRESULT Direct3DInterop::Connect(_In_ IDrawingSurfaceRuntimeHostNative* host)
{
	if( CCAppManager::Startup() )
	{
		gView = new CCGLView();
		gEngine = new CCAppEngine();
		gView->resizeView( m_renderResolution.Width, m_renderResolution.Height );
		gEngine->setupNativeThread();
		gEngine->createRenderer();
		gEngine->setupEngineThread();
	}
	else
	{
		CCAppManager::Resume();
	}
	
	gDeviceRenderer->UpdateForWindowSizeChange(WindowBounds.Width, WindowBounds.Height);
	gDeviceRenderer->UpdateForRenderResolutionChange(m_renderResolution.Width, m_renderResolution.Height);

	return S_OK;
}

void Direct3DInterop::Disconnect()
{
	CCAppManager::Pause();
}

HRESULT Direct3DInterop::PrepareResources(_In_ const LARGE_INTEGER* presentTargetTime, _Out_ BOOL* contentDirty)
{
	*contentDirty = true;

	return S_OK;
}

HRESULT Direct3DInterop::GetTexture(_In_ const DrawingSurfaceSizeF* size, _Out_ IDrawingSurfaceSynchronizedTextureNative** synchronizedTexture, _Out_ DrawingSurfaceRectF* textureSubRectangle)
{
	gEngine->updateEngineThread();
	gEngine->updateJobsThread();

	RequestAdditionalFrame();

	return S_OK;
}

ID3D11Texture2D* Direct3DInterop::GetTexture()
{
	return gDeviceRenderer->GetTexture();
}

void Direct3DInterop::Application_Launching()
{
	DEBUGLOG("Direct3DInterop::Application_Launching\n");
}

void Direct3DInterop::Application_Activated()
{
	DEBUGLOG("Direct3DInterop::Application_Activated\n");
}

void Direct3DInterop::Application_Deactivated()
{
	DEBUGLOG("Direct3DInterop::Application_Deactivated\n");
}

void Direct3DInterop::Application_Closing()
{
	DEBUGLOG("Direct3DInterop::Application_Closing\n");
    CCAppManager::Shutdown();
}

bool Direct3DInterop::OnBackButtonPressed()
{
	if( gEngine != NULL )
	{
		return gEngine->shouldHandleBackButton();
	}

	return false;
}


static void PrintChars(const char *chars)
{
	if( chars != NULL )
	{
		DEBUGLOG( chars );
		DEBUGLOG( "\n" );
	}
}


void Direct3DInterop::Print(Platform::String^ string)
{
#ifdef DEBUGON
	if( string != nullptr )
	{
		PrintChars( GetChars( string ) );
	}
#endif
}


static JSAction *currentJSAction = NULL;
Platform::String^ Direct3DInterop::jsActionRequest()
{
	if( currentJSAction == NULL && jsActionStack.length > 0 )
	{
		currentJSAction = jsActionStack.pop();

		//PrintChars( currentJSAction->action.buffer );
		return GetString( currentJSAction->action.buffer );
	}

	return "";
}


void Direct3DInterop::jsActionResult(Platform::String^ actionString, Platform::String^ parameters)
{
	if( actionString != nullptr )
	{
		//Print( actionString );
		if( parameters != nullptr )
		{
			//Print( parameters );
		}

		CCText action = GetChars( actionString );
		if( CCText::Equals( action.buffer, "CCWebJS::JavaScriptResult" ) )
        {
			ASSERT( currentJSAction->callback != NULL )
			{
				currentJSAction->callback->runParameters = (void*)GetChars( parameters );
				currentJSAction->callback->safeRun();
			}
		}

#ifdef DEBUGON
		else if( CCText::Equals( action.buffer, "CCWebJS::JavaScriptError" ) )
		{
			PrintChars( "CCWebJS::JavaScriptError" );
			Print( parameters );
		}
#endif
	}

	DELETE_POINTER( currentJSAction );
}


static CSAction *currentCSAction = NULL;
Platform::String^ Direct3DInterop::csActionRequest()
{
	if( gEngine != NULL )
	{
		if( gEngine->engineThreadRunning )
		{
			gEngine->updateNativeThread();
		}
	}

	if( currentCSAction == NULL && csActionStack.length > 0 )
	{
		currentCSAction = csActionStack.pop();

		PrintChars( currentCSAction->action.buffer );
		return GetString( currentCSAction->action.buffer );
	}

	return "";
}


void Direct3DInterop::csActionResult(Platform::String^ actionString, Platform::String^ parameters)
{
	if( actionString != nullptr )
	{
		Print( actionString );
		if( parameters != nullptr )
		{
			//Print( parameters );
		}

		CCText action = GetChars( actionString );
		if( CCText::Equals( action.buffer, "CCAppManager::InAppPurchaseSuccessful" ) )
        {
			CCText result = GetChars( parameters );
			const bool success = CCText::Equals( result, "true" );
			if( success )
			{
				CCAppManager::InAppPurchaseSuccessful();
			}
		}
#ifdef DEBUGON
		else if( CCText::Equals( action.buffer, "CCFileManager::syncedToIsoStore" ) )
		{
			CCText debug = "CCFileManager::syncedToIsoStore ";
			debug += GetChars( parameters );
			debug += " ";
			debug += gEngine->time.lifetime;
			debug += "\n";
			DEBUGLOG( debug.buffer );
		}
#endif
	}

	DELETE_POINTER( currentCSAction );
}


void Direct3DInterop::csActionResult_CCDeviceURLManager_downloadFinished(Platform::String^ urlString, bool success, const Platform::Array<byte>^ resultArray, Platform::String^ headersString)
{
	CCText url = GetChars( urlString );
	CCData result;
	result.set( (char*)resultArray->Data, resultArray->Length );
	CCText headers = GetChars( headersString );
	gEngine->urlManager->deviceURLManager->downloadFinished( url.buffer, success, result.buffer, result.length, headers.buffer );
	
	DELETE_POINTER( currentCSAction );
}


void Direct3DInterop::csActionResult_CCWeb_LoadedPage(Platform::String^ actionString, Platform::String^ urlString, bool loaded)
{
	if( actionString != nullptr )
	{
		Print( actionString );
		Print( urlString );
		if( !loaded )
		{
			Print( "error" );
		}
		
		CCText action = GetChars( actionString );
		CCText url = GetChars( urlString );

		if( CCText::Equals( action.buffer, "CCWebView::LoadedPage" ) )
		{
			CCWebView::LoadedPage( url.buffer, loaded );
		}
		else if( CCText::Equals( action.buffer, "CCWebJS::LoadedPage" ) )
		{
			CCWebJS::LoadedPage( url.buffer, loaded );
		}
	}
	
	DELETE_POINTER( currentCSAction );
}

}
