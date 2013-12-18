using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using System.IO;
using System.Text.RegularExpressions;
using Windows.Storage;

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
            else if (action == "CCDeviceURLManager::processPostRequest")
            {
                String[] split = Regex.Split(actionData, ",");
                String url = split[0];
                if (split.Length == 3)
                {
                    String postBodyFile = split[1];
                    String boundary = split[2];
                    processPostRequest(url, postBodyFile, boundary);
                }
                else
                {
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

        // POST
        static String postURL = null;
        static byte[] postBody = null;
        static async void processPostRequest(String url, String postBodyFile, String boundary)
        {
            postURL = url;
            postBody = await GetFileData(postBodyFile);

            System.Uri myUri = new System.Uri( url );
            HttpWebRequest myRequest = (HttpWebRequest)HttpWebRequest.Create(myUri);
            myRequest.Method = "POST";
            myRequest.ContentType = "multipart/form-data;boundary=" + boundary;
            myRequest.BeginGetRequestStream( new AsyncCallback( GetRequestStreamCallback ), myRequest );
        }

        public static async Task<byte[]> GetFileData(string filename)
        {
            byte[] data;
            StorageFolder localFolder = ApplicationData.Current.LocalFolder;
            StorageFile localFile = await localFolder.GetFileAsync(filename);
            using (Stream localFileStream = await localFile.OpenStreamForReadAsync())
            {
                data = new byte[localFileStream.Length];
                await localFileStream.ReadAsync(data, 0, (int)localFileStream.Length);
                localFileStream.Close();

                await localFile.DeleteAsync();

                return data;
            }
        }

        static void GetRequestStreamCallback(IAsyncResult callbackResult)
        {
            HttpWebRequest myRequest = (HttpWebRequest)callbackResult.AsyncState;

            if (postBody != null && postBody.Length > 0)
            {
                // End the stream request operation
                Stream postStream = myRequest.EndGetRequestStream(callbackResult);
                // Add the post data to the web request
                postStream.Write(postBody, 0, postBody.Length);
                postStream.Close();
            }

            // Start the web request
            myRequest.BeginGetResponse(new AsyncCallback(GetResponsetStreamCallback), myRequest);
        }

        static void GetResponsetStreamCallback(IAsyncResult callbackResult)
        {
            HttpWebRequest request = (HttpWebRequest)callbackResult.AsyncState;
            HttpWebResponse response = (HttpWebResponse)request.EndGetResponse( callbackResult );

            WebHeaderCollection responseHeaders = response.Headers;
            string headers = "[ \n";
            if (responseHeaders != null)
            {
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

            byte[] bytes;
            using (Stream stream = response.GetResponseStream())
            {
                BinaryReader reader = new BinaryReader(stream);
                bytes = reader.ReadBytes((int)stream.Length);
            }

            MainPage.m_d3dInterop.csActionResult_CCDeviceURLManager_downloadFinished(postURL, true, bytes, headers);
        }
    }
}
