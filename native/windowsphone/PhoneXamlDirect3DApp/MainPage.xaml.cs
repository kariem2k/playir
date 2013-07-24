using Microsoft.Phone.Controls;
using PhoneXamlDirect3DAppComp;
using System;
using System.ComponentModel;
using System.Windows;


namespace PhoneXamlDirect3DApp
{
    public partial class MainPage : PhoneApplicationPage
    {
        public static MainPage m_mainPage = null;
        public static Direct3DInterop m_d3dInterop = new Direct3DInterop( "" );

        CSEngine m_csEngine;

        // Constructor
        public MainPage()
        {
            InitializeComponent();

            m_mainPage = this;
            m_csEngine = new CSEngine();
        }

        private void DrawingSurface_Loaded(object sender, RoutedEventArgs e)
        {
            // Set window bounds in dips
            m_d3dInterop.WindowBounds = new Windows.Foundation.Size(
                (float)DrawingSurface.ActualWidth,
                (float)DrawingSurface.ActualHeight
                );

            // Set native resolution in pixels
            m_d3dInterop.NativeResolution = new Windows.Foundation.Size(
                (float)Math.Floor(DrawingSurface.ActualWidth * Application.Current.Host.Content.ScaleFactor / 100.0f + 0.5f),
                (float)Math.Floor(DrawingSurface.ActualHeight * Application.Current.Host.Content.ScaleFactor / 100.0f + 0.5f)
                );

            // Set render resolution to the full native resolution
            m_d3dInterop.RenderResolution = m_d3dInterop.NativeResolution;

            // Hook-up native component to DrawingSurface
            DrawingSurface.SetContentProvider(m_d3dInterop.CreateContentProvider());
            DrawingSurface.SetManipulationHandler(m_d3dInterop);
        }

        public void Application_Launching()
        {
            m_d3dInterop.Application_Launching();
        }

        public void Application_Activated()
        {
            m_d3dInterop.Application_Activated();
            CSAudioManager.Application_Activated();
        }

        public void Application_Deactivated()
        {
            m_csEngine.jsWork();
            m_csEngine.csWork();
            m_d3dInterop.Application_Deactivated();
        }

        public void Application_Closing()
        {
            m_d3dInterop.Application_Closing();
        }

        protected override void OnBackKeyPress(CancelEventArgs e)
        {
            e.Cancel = m_d3dInterop.OnBackButtonPressed();
        }
    }
}