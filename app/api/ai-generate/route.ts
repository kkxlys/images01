import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, size } = await request.json();

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: '请提供描述内容' },
        { status: 400 }
      );
    }

    // 获取环境变量中的API密钥
    const apiKey = process.env.ARK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      );
    }

    // 映射前端尺寸格式到火山引擎API格式
    // 注意：火山引擎要求图片尺寸至少921600像素
    const sizeMapping: Record<string, string> = {
      '512x512': '1k',      // 使用1k替代过小的尺寸
      '768x512': '1k',      // 使用1k替代过小的尺寸
      '512x768': '1k',      // 使用1k替代过小的尺寸
      '1024x1024': '2k',
      '1024x768': '1024x768',
      '768x1024': '768x1024'
    };

    const apiSize = sizeMapping[size] || '2k';

    // 根据风格优化提示词
    const stylePrompts: Record<string, string> = {
      realistic: '写实风格，真实感，高质量摄影',
      artistic: '艺术风格，油画质感，抽象艺术',
      anime: '动漫风格，日式插画，anime style',
      cartoon: '卡通风格，可爱，cartoon style',
      digital: '数字艺术，现代设计，digital art',
      watercolor: '水彩画风格，水彩质感，watercolor painting'
    };

    const stylePrompt = stylePrompts[style] || '';
    const enhancedPrompt = stylePrompt ? `${prompt}, ${stylePrompt}` : prompt;

    // 构建请求数据
    const requestData = {
      model: "ep-20250922151247-nzclw",
      prompt: enhancedPrompt,
      sequential_image_generation: "disabled",
      response_format: "url",
      size: apiSize,
      stream: false,
      watermark: true
    };

    console.log('调用火山引擎API，请求数据:', requestData);

    // 调用火山引擎API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('火山引擎API错误:', errorText);
      return NextResponse.json(
        { error: `API调用失败: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('火山引擎API响应:', result);

    // 检查响应格式
    if (!result.data || !result.data[0] || !result.data[0].url) {
      console.error('API响应格式错误:', result);
      return NextResponse.json(
        { error: '生成图片失败，响应格式错误' },
        { status: 500 }
      );
    }

    // 返回生成的图片URL
    return NextResponse.json({
      success: true,
      imageUrl: result.data[0].url,
      prompt: enhancedPrompt,
      originalPrompt: prompt,
      style: style,
      size: size,
      usage: result.usage
    });

  } catch (error) {
    console.error('AI生图API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}