using Microsoft.Phone.Controls;
using Microsoft.Phone.Tasks;
using System;


namespace PhoneXamlDirect3DApp
{
    class CSWeb
    {
        private WebBrowser m_webView;
        private bool m_webViewClearCookies = false;
        private WebBrowser m_webJS;
        private bool loadingWebJS = false;

        public void jsWork(String action, String actionData)
        {
            if (action == "CCWebJS::runJavaScript")
            {
                if (m_webJS != null)
                {
                    String script = actionData;

                    try
                    {
                        string result = m_webJS.InvokeScript("eval", script).ToString();
                        MainPage.m_d3dInterop.jsActionResult("CCWebJS::JavaScriptResult", result);
                    }
                    catch (Exception e)
                    {
                        string error = e.ToString();
                        MainPage.m_d3dInterop.jsActionResult("CCWebJS::JavaScriptError", script + " " + (error != null ? error : ""));
                    }
                }
            }
        }

        public bool csWork(String action, String actionData)
        {
            if (action == "CCWebView::openPage")
            {
                if (m_webView == null)
                {
                    m_webView = new WebBrowser();
                    m_webView.IsScriptEnabled = true;

                    if (m_webViewClearCookies)
                    {
                        m_webViewClearCookies = false;
                        m_webView.ClearCookiesAsync();
                    }

                    m_webView.LoadCompleted += new System.Windows.Navigation.LoadCompletedEventHandler(webBrowser_WebView_LoadCompleted);
                    m_webView.Navigating += new EventHandler<NavigatingEventArgs>(webBrowser_Navigating);
                    m_webView.NavigationFailed += new System.Windows.Navigation.NavigationFailedEventHandler(webBrowser_WebView_NavigationFailed);
                    m_webView.Navigated += new EventHandler<System.Windows.Navigation.NavigationEventArgs>(webBrowser_Navigated);

                    MainPage.m_mainPage.LayoutRoot.Children.Add(m_webView);
                }

                String url = actionData;
                m_webView.Navigate(new Uri(url));

                return true;
            }
            else if (action == "CCWebView::close")
            {
                if (m_webView != null)
                {
                    MainPage.m_mainPage.LayoutRoot.Children.Remove(m_webView);
                    m_webView = null;
                    MainPage.m_d3dInterop.csActionResult("CCWebView::closed", "");
                }

                return true;
            }
            else if (action == "CCWebView::clearData")
            {
                if (m_webView != null)
                {
                    m_webView.ClearCookiesAsync();
                }
                else
                {
                    m_webViewClearCookies = true;
                }
                MainPage.m_d3dInterop.csActionResult("CCWebView::clearedData", "");

                return true;
            }

            else if (action == "CCWebJS::openPage" || action == "CCWebJS::openFile")
            {
                if (m_webJS == null)
                {
                    m_webJS = new WebBrowser();
                    //m_webJS.ClearInternetCacheAsync();
                    m_webJS.IsScriptEnabled = true;

                    m_webJS.LoadCompleted += new System.Windows.Navigation.LoadCompletedEventHandler(webBrowser_WebJS_LoadCompleted);
                    m_webJS.Navigating += new EventHandler<NavigatingEventArgs>(webBrowser_Navigating);
                    m_webJS.NavigationFailed += new System.Windows.Navigation.NavigationFailedEventHandler(webBrowser_WebJS_NavigationFailed);
                    m_webJS.Navigated += new EventHandler<System.Windows.Navigation.NavigationEventArgs>(webBrowser_Navigated);
                }

                loadingWebJS = true;

                if (action == "CCWebJS::openPage")
                {
                    String url = actionData;
                    Uri uri = new Uri(url);
                    m_webJS.Navigate(uri);
                }
                else
                {
                    //String filePath = actionData;
                    //using (StreamReader reader = new StreamReader(filePath))
                    //{
                    //    m_webJS.NavigateToString(reader.ReadToEnd());
                    //}
                    webBrowser_WebJS_OpenFile(actionData);
                }

                return true;
            }
            else if (action == "CCWebJS::close")
            {
                if (m_webJS != null)
                {
                    m_webJS = null;
                    MainPage.m_d3dInterop.csActionResult("CCWebJS::closed", "");
                }

                return true;
            }
            else if (action == "CCAppManager::WebBrowserOpen")
            {
                String url = actionData;
                WebBrowserTask task = new WebBrowserTask();
                task.Uri = new Uri(url);
                task.Show();

                MainPage.m_d3dInterop.csActionResult("CCAppManager::WebBrowserOpened", "");

                return true;
            }

            return false;
        }


        void webBrowser_Navigated(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
        }

        void webBrowser_Navigating(object sender, NavigatingEventArgs e)
        {
        }


        void webBrowser_WebView_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            var url = e.Uri.ToString();

            if (sender == m_webView)
            {
                MainPage.m_d3dInterop.csActionResult_CCWeb_LoadedPage("CCWebView::LoadedPage", url, true);
            }
        }

        void webBrowser_WebView_NavigationFailed(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            var url = e.Uri.ToString();

            if (sender == m_webView)
            {
                MainPage.m_d3dInterop.csActionResult_CCWeb_LoadedPage("CCWebView::LoadedPage", url, false);
            }
        }


        async void webBrowser_WebJS_OpenFile(string filename)
        {
            await CSEngine.SyncToIsoStore(filename, true);
            Uri uri = new Uri(filename, UriKind.Relative);
            m_webJS.Base = "cache";
            m_webJS.Navigate(uri);
        }

        void webBrowser_WebJS_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            var url = e.Uri.ToString();

            if (sender == m_webJS && loadingWebJS)
            {
                loadingWebJS = false;
                MainPage.m_d3dInterop.csActionResult_CCWeb_LoadedPage("CCWebJS::LoadedPage", url, true);
            }
        }

        void webBrowser_WebJS_NavigationFailed(object sender, System.Windows.Navigation.NavigationFailedEventArgs e)
        {
            var url = e.Uri.ToString();

            if (sender == m_webJS && loadingWebJS)
            {
                loadingWebJS = false;
                MainPage.m_d3dInterop.csActionResult_CCWeb_LoadedPage("CCWebJS::LoadedPage", url, false);
            }
        }
    }
}
