import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData, prompt = "图片主要讲了什么?" } = await request.json();

    if (!imageData) {
      return NextResponse.json(
        { error: '请提供图片数据' },
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

    // 检测图片格式
    let imageFormat = 'jpeg';
    if (imageData.startsWith('/9j/')) {
      imageFormat = 'jpeg';
    } else if (imageData.startsWith('iVBORw0KGgo')) {
      imageFormat = 'png';
    } else if (imageData.startsWith('UklGR')) {
      imageFormat = 'webp';
    }

    // 构建请求数据
    const requestData = {
      model: "ep-20250921140145-v9tg9",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/${imageFormat};base64,${imageData}`
              }
            }
          ]
        }
      ]
    };

    // 调用火山引擎API
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
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

    // 提取AI的回复内容
    const aiResponse = result.choices?.[0]?.message?.content || "无法识别图片内容";

    return NextResponse.json({
      success: true,
      content: aiResponse,
      usage: result.usage
    });

  } catch (error) {
    console.error('图片识别API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}