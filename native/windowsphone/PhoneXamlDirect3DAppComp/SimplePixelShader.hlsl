cbuffer PSConstantBuffer : register(b0)
{
	float4 colour;
};

Texture2D simpleTexture : register(t0);
SamplerState simpleSampler : register(s0);

struct PixelShaderInput
{
	float4 pos : SV_POSITION;
	float4 colour : COLOR0;
    float2 tex : TEXCOORD0;
};

float4 main(PixelShaderInput input) : SV_TARGET
{
    float4 texelColour = simpleTexture.Sample(simpleSampler, float2(input.tex.x, input.tex.y));
	return colour * input.colour * texelColour;
}
