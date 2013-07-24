using Microsoft.Phone.Info;
using System;
using System.IO;
using System.IO.IsolatedStorage;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Threading;
using Windows.ApplicationModel.Store;
using Windows.Storage;


namespace PhoneXamlDirect3DApp
{
    class CSEngine
    {
        DispatcherTimer m_jsTimer = new DispatcherTimer();
        DispatcherTimer m_csTimer = new DispatcherTimer();

        private TextBox m_textBox;
        private CSWeb m_csWeb;

#if DEBUGON
        private int memoryTimer = 0;
#endif

        public CSEngine()
        {
            // Fast timer for js calls
            m_jsTimer.Tick += jsTick;
            m_jsTimer.Interval = new TimeSpan(0, 0, 0, 0, 2); // Every 2 milliseconds
            m_jsTimer.Start();

            // Timer for general C# operations
            m_csTimer.Tick += csTick;
            m_csTimer.Interval = new TimeSpan(0, 0, 0, 0, 50); // Every 50 milliseconds
            m_csTimer.Start();

            m_csWeb = new CSWeb();
        }

        private void jsTick(object state, EventArgs args)
        {
            jsWork();
        }

        public void jsWork()
        {
            String actionString = MainPage.m_d3dInterop.jsActionRequest();
            if (actionString.Length > 0)
            {
                String action, actionData;
                {
                    String[] split = Regex.Split(actionString, ", ");
                    action = split[0];
                    actionData = split.Length > 1 ? split[1] : "";
                    for (int i = 2; i < split.Length; ++i)
                    {
                        actionData += ", ";
                        actionData += split[i];
                    }
                }

                m_csWeb.jsWork(action, actionData);
            }
        }

        private void csTick(object state, EventArgs args)
        {
            csWork();
        }

        public void csWork()
        {
#if DEBUGON
            memoryTimer += 50;
            if (memoryTimer > 1000)
            {
                memoryTimer -= 1000;

                object totalmemory = DeviceExtendedProperties.GetValue("DeviceTotalMemory");
                object appmemory = DeviceExtendedProperties.GetValue("ApplicationCurrentMemoryUsage");
                object peakmemory = DeviceExtendedProperties.GetValue("ApplicationPeakMemoryUsage");

                MainPage.m_d3dInterop.Print("memory - total: " + totalmemory + " app: " + appmemory + " peak: " + peakmemory);
            }
#endif

            String actionString = MainPage.m_d3dInterop.csActionRequest();
            if (actionString.Length > 0)
            {
                String action, actionData;
                {
                    String[] split = Regex.Split(actionString, ", ");
                    action = split[0];
                    actionData = split.Length > 1 ? split[1] : "";
                    for (int i = 2; i < split.Length; ++i)
                    {
                        actionData += ", ";
                        actionData += split[i];
                    }
                }

                if (CSURLManager.csWork(action, actionData))
                {
                }

                else if (action == "CCFileManager::syncToIsoStore")
                {
                    fileManager_SyncToIsoStore(actionData);
                }

                else if (m_csWeb.csWork(action, actionData))
                {
                }

                else if (CSAudioManager.csWork(action, actionData))
                {
                }

                else if (action == "CCAppManager::InAppPurchase")
                {
                    String productID = actionData;
                    inAppPurchase_Purchase(productID);
                }

                else if (action == "CCAppManager::KeyboardToggle")
                {
                    bool show = (actionData == "true");

                    if (show)
                    {
                        if (m_textBox == null)
                        {
                            m_textBox = new TextBox();
                            MainPage.m_mainPage.LayoutRoot.Children.Insert(0, m_textBox);
                            m_textBox.Opacity = 0.0;
                            m_textBox.Focus();

                            m_textBox.KeyUp += new System.Windows.Input.KeyEventHandler(textBox_keyUp);
                        }
                    }
                    else
                    {
                        if (m_textBox != null)
                        {
                            MainPage.m_mainPage.LayoutRoot.Children.Remove(m_textBox);
                            m_textBox = null;
                        }
                    }

                    MainPage.m_d3dInterop.csActionResult("CCAppManager::KeyboardToggled", "");
                }
            }
        }


        async void fileManager_SyncToIsoStore(string filename)
        {
            bool synced = await SyncToIsoStore(filename, false);
            MainPage.m_d3dInterop.csActionResult("CCFileManager::syncedToIsoStore", synced ? "true" : "false");
        }

        public static async Task<bool> SyncToIsoStore(string filename, bool overwrite)
        {
            IsolatedStorageFile isoStore = IsolatedStorageFile.GetUserStoreForApplication();
            isoStore.CreateDirectory("cache");
            if (overwrite || !isoStore.FileExists("cache/" + filename))
            {
                byte[] data;
                StorageFolder localFolder = ApplicationData.Current.LocalFolder;
                StorageFile localFile = await localFolder.GetFileAsync(filename);
                using (Stream localFileStream = await localFile.OpenStreamForReadAsync())
                {
                    data = new byte[localFileStream.Length];
                    await localFileStream.ReadAsync(data, 0, (int)localFileStream.Length);
                    localFileStream.Close();

                    using (var stream = new IsolatedStorageFileStream("cache/" + filename, FileMode.Create, FileAccess.Write, isoStore))
                    {
                        stream.Write(data, 0, data.Length);
                        stream.Close();
                    }

                    //StreamWriter fileWriter = new StreamWriter(new IsolatedStorageFileStream("cache/" + filename, FileMode.Truncate, isoStore));
                    //fileWriter.Write(data, 0, data.Length);
                    //fileWriter.Close();

                    //StreamReader fileReader = new StreamReader(new IsolatedStorageFileStream("cache/" + filename, FileMode.Open, isoStore));
                    //string contents = fileReader.ReadToEnd();
                    //fileReader.Close();

                    return true;
                }
            }

            return false;
        }


        void textBox_keyUp(object sender, KeyEventArgs e)
        {
            Key key = e.Key;

            String cKey = null;
            if (key >= Key.A && key <= Key.Z)
            {
                cKey = m_textBox.Text;
            }
            else if (key >= Key.D0 && key <= Key.D9)
            {
                cKey = m_textBox.Text;
            }
            else if (key == Key.Space)
            {
                cKey = " ";
            }
            else if (key == Key.Unknown && e.PlatformKeyCode == 190)
            {
                cKey = ".";
            }
            else if (key == Key.Unknown && e.PlatformKeyCode == 188)
            {
                cKey = ",";
            }
            else if (key == Key.Unknown && e.PlatformKeyCode == 189)
            {
                cKey = "-";
            }
            else if (key == Key.Back)
            {
                cKey = "backspace";
            }
            else if (key == Key.Enter)
            {
                cKey = "return";
            }
            else
            {
                cKey = m_textBox.Text;
            }
            m_textBox.Text = "";

            if (cKey != null)
            {
                MainPage.m_d3dInterop.OnKeyUp(cKey);
            }
        }


        public async void inAppPurchase_Purchase(string productID)
        {
            try
            {
                ListingInformation products = await CurrentApp.LoadListingInformationByProductIdsAsync(new[] { productID });

                // get specific in-app product by ID
                ProductListing productListing = null;
                if (!products.ProductListings.TryGetValue(productID, out productListing))
                {
                    MainPage.m_d3dInterop.csActionResult("CCAppManager::InAppPurchaseSuccessful", "false");
                    return;
                }

                bool isActive = false;
                ProductLicense pLicense;
                if (CurrentApp.LicenseInformation.ProductLicenses.TryGetValue(productID, out pLicense))
                {
                    isActive = pLicense.IsActive;
                }

                if (isActive)
                {
                    // Auto-consume product
                    if (pLicense.IsConsumable)
                    {
                        CurrentApp.ReportProductFulfillment(productID);
                    }
                    MainPage.m_d3dInterop.csActionResult("CCAppManager::InAppPurchaseSuccessful", "true");
                    return;
                }

                string result = await CurrentApp.RequestProductPurchaseAsync(productID, true);

                if (CurrentApp.LicenseInformation.ProductLicenses.TryGetValue(productID, out pLicense))
                {
                    // Auto-consume product
                    if (pLicense.IsConsumable)
                    {
                        CurrentApp.ReportProductFulfillment(productID);
                    }
                }

                if (result.Length > 0)
                {
                    // Purchased
                    MainPage.m_d3dInterop.csActionResult("CCAppManager::InAppPurchaseSuccessful", "true");
                }
                else
                {
                    MainPage.m_d3dInterop.csActionResult("CCAppManager::InAppPurchaseSuccessful", "true");
                }
            }
            catch (Exception e)
            {
#if DEBUGON
                MainPage.m_d3dInterop.Print("InAppPurchase::Error" + e.ToString());
#endif

                // The in-app purchase was not completed because the
                // customer canceled it or an error occurred.
                MainPage.m_d3dInterop.csActionResult("CCAppManager::InAppPurchaseSuccessful", "false");
            }
        }
    }
}
