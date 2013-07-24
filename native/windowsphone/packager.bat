del "PhoneXamlDirect3DApp\Resources\Packaged\*.*" /s /f /q
for /R "../Engine/Resources" %%f in (*) do copy %%f "PhoneXamlDirect3DApp\Resources\Packaged"
for /R "../App/Resources" %%f in (*) do copy %%f "PhoneXamlDirect3DApp\Resources\Packaged"