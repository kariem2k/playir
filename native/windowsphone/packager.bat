del "PhoneXamlDirect3DApp\Resources\Packaged\*.*" /s /f /q

copy /y "Assets\*" "PhoneXamlDirect3DApp\Resources"

for /R "../engine/resources" %%f in (*) do copy %%f "PhoneXamlDirect3DApp\Resources\Packaged"
for /R "../app/resources" %%f in (*) do copy %%f "PhoneXamlDirect3DApp\Resources\Packaged"
for /R "../resources" %%f in (*) do copy %%f "PhoneXamlDirect3DApp\Resources\Packaged"
