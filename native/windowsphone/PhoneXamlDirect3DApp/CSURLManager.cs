using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.IO;

namespace PhoneXamlDirect3DApp
{
    class CSURLManager
    {
        static WebClient webClient = null;

        public static bool csWork(String action, String actionData)
        {
            if (action == "CCDeviceURLManager::processRequest")
            {
                if (webClient == null)
                {
                    webClient = new WebClient();
                    webClient.OpenReadCompleted += new OpenReadCompletedEventHandler(webClient_URLManager_OpenReadCompleted);
                }

                String url = actionData;
                try
                {
                    webClient.OpenReadAsync(new Uri(url), url);
                }
                catch (Exception e)
                {
#if DEBUGON
                    MainPage.m_d3dInterop.Print("CCDeviceURLManager::Error" + e.ToString());
#endif

                    MainPage.m_d3dInterop.csActionResult_CCDeviceURLManager_downloadFinished(url, false, null, "");
                }
                return true;
            }
            return false;
        }

        static void webClient_URLManager_OpenReadCompleted(object sender, OpenReadCompletedEventArgs e)
        {
            WebClient webClient = (WebClient)sender;
            var url = e.UserState as String;

            if (e.Cancelled || e.Error != null)
            {
                MainPage.m_d3dInterop.csActionResult_CCDeviceURLManager_downloadFinished(url, false, null, "");
            }
            else
            {
                string headers = "[ \n";
                if (webClient != null)
                {
                    WebHeaderCollection responseHeaders = webClient.ResponseHeaders;
                    string[] keys = responseHeaders.AllKeys;
                    for (int i = 0; i < keys.Length; ++i)
                    {
                        string key = keys[i];
                        string value = responseHeaders[key];

                        if (i > 0)
                        {
                            headers += ",\n";
                        }

                        headers += "[ \"" + key + "\",\"" + value + "\" ]";
                    }
                }
                headers += "]";

                Stream stream = (Stream)e.Result;
                BinaryReader reader = new BinaryReader(stream);

                byte[] bytes = reader.ReadBytes((int)stream.Length);

                MainPage.m_d3dInterop.csActionResult_CCDeviceURLManager_downloadFinished(url, true, bytes, headers);
            }
        }
    }
}
