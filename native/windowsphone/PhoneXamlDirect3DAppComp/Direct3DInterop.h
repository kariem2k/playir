#pragma once

#include "pch.h"
#include "BasicTimer.h"
#include <DrawingSurfaceNative.h>

namespace PhoneXamlDirect3DAppComp
{

public delegate void RequestAdditionalFrameHandler();
public delegate void RecreateSynchronizedTextureHandler();

[Windows::Foundation::Metadata::WebHostHidden]
public ref class Direct3DInterop sealed : public Windows::Phone::Input::Interop::IDrawingSurfaceManipulationHandler
{
public:
	Direct3DInterop(Platform::String^ token);

	Windows::Phone::Graphics::Interop::IDrawingSurfaceContentProvider^ CreateContentProvider();

	// IDrawingSurfaceManipulationHandler
	virtual void SetManipulationHost(Windows::Phone::Input::Interop::DrawingSurfaceManipulationHost^ manipulationHost);

	event RequestAdditionalFrameHandler^ RequestAdditionalFrame;
	event RecreateSynchronizedTextureHandler^ RecreateSynchronizedTexture;

	property Windows::Foundation::Size WindowBounds;
	property Windows::Foundation::Size NativeResolution;
	property Windows::Foundation::Size RenderResolution
	{
		Windows::Foundation::Size get(){ return m_renderResolution; }
		void set(Windows::Foundation::Size renderResolution);
	}

protected:
	// Event Handlers
	void OnPointerPressed(Windows::Phone::Input::Interop::DrawingSurfaceManipulationHost^ sender, Windows::UI::Core::PointerEventArgs^ args);
	void OnPointerMoved(Windows::Phone::Input::Interop::DrawingSurfaceManipulationHost^ sender, Windows::UI::Core::PointerEventArgs^ args);
	void OnPointerReleased(Windows::Phone::Input::Interop::DrawingSurfaceManipulationHost^ sender, Windows::UI::Core::PointerEventArgs^ args);

public:
	void OnKeyUp(Platform::String^ key);

internal:
	HRESULT STDMETHODCALLTYPE Connect(_In_ IDrawingSurfaceRuntimeHostNative* host);
	void STDMETHODCALLTYPE Disconnect();
	HRESULT STDMETHODCALLTYPE PrepareResources(_In_ const LARGE_INTEGER* presentTargetTime, _Out_ BOOL* contentDirty);
	HRESULT STDMETHODCALLTYPE GetTexture(_In_ const DrawingSurfaceSizeF* size, _Out_ IDrawingSurfaceSynchronizedTextureNative** synchronizedTexture, _Out_ DrawingSurfaceRectF* textureSubRectangle);
	ID3D11Texture2D* GetTexture();

private:
	Windows::Foundation::Size m_renderResolution;

public:
    void Application_Launching();
    void Application_Activated();
    void Application_Deactivated();
    void Application_Closing();
	
	bool OnBackButtonPressed();
	
	void Print(Platform::String^ string);

	// JS calls are separate to allow for fast tracking
	Platform::String^ jsActionRequest();
	void jsActionResult(Platform::String^ action, Platform::String^ parameters);
	
	// Generic C# calls
	Platform::String^ csActionRequest();
	void csActionResult(Platform::String^ action, Platform::String^ parameters);
	
	void csActionResult_CCDeviceURLManager_downloadFinished(Platform::String^ url, bool success, const Platform::Array<byte>^ result, Platform::String^ headers);
	void csActionResult_CCWeb_LoadedPage(Platform::String^ actionString, Platform::String^ urlString, bool loaded);
};

}
