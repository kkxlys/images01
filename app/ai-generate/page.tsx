"use client";

import { useState } from "react";
import Link from "next/link";

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  timestamp: Date;
}

export default function AIGeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("realistic");
  const [size, setSize] = useState("512x512");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const styles = [
    { value: "realistic", label: "写实风格", description: "真实感强的照片风格" },
    { value: "artistic", label: "艺术风格", description: "抽象艺术或绘画风格" },
    { value: "anime", label: "动漫风格", description: "日式动漫插画风格" },
    { value: "cartoon", label: "卡通风格", description: "可爱的卡通角色风格" },
    { value: "digital", label: "数字艺术", description: "现代数字艺术风格" },
    { value: "watercolor", label: "水彩画", description: "水彩绘画效果" }
  ];

  const sizes = [
    { value: "512x512", label: "正方形 (512×512)" },
    { value: "768x512", label: "横向 (768×512)" },
    { value: "512x768", label: "纵向 (512×768)" },
    { value: "1024x1024", label: "高清正方形 (1024×1024)" }
  ];

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      // 模拟AI生图过程（实际项目中需要调用AI生图API）
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 生成模拟图片（使用占位图服务）
      const [width, height] = size.split('x').map(Number);
      const mockImageUrl = `https://picsum.photos/${width}/${height}?random=${Date.now()}`;

      const newImage: GeneratedImage = {
        url: mockImageUrl,
        prompt: prompt,
        style: style,
        timestamp: new Date()
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      setLoading(false);
    } catch (error) {
      console.error('生图失败:', error);
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `ai_generated_${prompt.substring(0, 20)}_${Date.now()}.jpg`;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const clearHistory = () => {
    setGeneratedImages([]);
  };

  const selectedStyleInfo = styles.find(s => s.value === style);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI 生图
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              通过文字描述生成高质量图片，释放创意无限可能
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 控制面板 */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  生成设置
                </h2>

                <div className="space-y-6">
                  {/* 文字描述 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      描述内容
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="描述你想要生成的图片，例如：一只可爱的小猫坐在花园里..."
                      className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white resize-none"
                    />
                  </div>

                  {/* 风格选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      艺术风格
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      {styles.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    {selectedStyleInfo && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedStyleInfo.description}
                      </p>
                    )}
                  </div>

                  {/* 尺寸选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      图片尺寸
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    >
                      {sizes.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 生成按钮 */}
                  <button
                    onClick={generateImage}
                    disabled={loading || !prompt.trim()}
                    className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        生成中...
                      </div>
                    ) : (
                      "生成图片"
                    )}
                  </button>

                  {generatedImages.length > 0 && (
                    <button
                      onClick={clearHistory}
                      className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                    >
                      清空历史
                    </button>
                  )}
                </div>

                {/* 使用提示 */}
                <div className="mt-8 p-4 bg-orange-50 dark:bg-slate-700 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    提示技巧
                  </h3>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• 描述要具体详细</li>
                    <li>• 包含颜色、光线等细节</li>
                    <li>• 可以指定相机角度</li>
                    <li>• 添加情感或氛围描述</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 结果展示 */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  生成结果
                </h2>

                {generatedImages.length === 0 ? (
                  <div className="text-center py-16">
                    <svg className="w-24 h-24 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      还没有生成图片
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      在左侧填写描述内容，点击"生成图片"开始创作
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {generatedImages.map((image, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                        <div className="aspect-square">
                          <img
                            src={image.url}
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                            {image.prompt}
                          </p>
                          <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span>风格: {styles.find(s => s.value === image.style)?.label}</span>
                            <span>{image.timestamp.toLocaleTimeString()}</span>
                          </div>
                          <button
                            onClick={() => downloadImage(image.url, image.prompt)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            下载图片
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 功能说明 */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-orange-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">多种风格</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                支持写实、艺术、动漫、卡通等多种艺术风格，满足不同创作需求
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">高质量输出</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                支持多种分辨率输出，从标准清晰度到高清画质，适配不同用途
              </p>
            </div>

            <div className="bg-green-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">快速生成</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                先进的AI算法，快速将文字描述转换为精美图片，激发无限创意
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}