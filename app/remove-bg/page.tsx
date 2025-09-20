"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function RemoveBgPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setProcessedUrl(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setProcessedUrl(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const removeBackground = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      // 简单的背景移除演示（实际项目中需要集成专业的AI服务）
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // 简单的白色背景移除算法（仅用于演示）
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 检测白色或接近白色的像素
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // 设置为透明
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        const processedDataUrl = canvas.toDataURL('image/png');
        setProcessedUrl(processedDataUrl);
        setLoading(false);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('背景移除失败:', error);
      setLoading(false);
    }
  };

  const downloadProcessed = () => {
    if (!processedUrl) return;

    const link = document.createElement('a');
    link.download = `no_bg_${selectedFile?.name || 'image'}.png`;
    link.href = processedUrl;
    link.click();
  };

  const resetAll = () => {
    setSelectedFile(null);
    setProcessedUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              抠图去背景
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              AI智能识别主体，一键去除图片背景，制作透明背景图片
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-green-500 dark:hover:border-green-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  拖拽图片到这里或点击选择
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  支持 JPG、PNG 等格式，建议选择主体明显的图片
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">原图</h3>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="原图"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                    </div>
                  </div>

                  {processedUrl && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">去背景后</h3>
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-checkered relative">
                        <img
                          src={processedUrl}
                          alt="去背景后"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                        <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">
                          透明背景
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={removeBackground}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? '处理中...' : '开始去背景'}
                  </button>

                  {processedUrl && (
                    <button
                      onClick={downloadProcessed}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      下载PNG图片
                    </button>
                  )}

                  <button
                    onClick={resetAll}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                  >
                    重新选择
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">使用说明</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 选择主体清晰、背景简单的图片效果更好</li>
                <li>• 目前支持简单的白色背景移除</li>
                <li>• 处理后的图片为PNG格式，支持透明背景</li>
                <li>• 可用于制作头像、产品图等</li>
              </ul>
            </div>

            <div className="bg-yellow-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">注意事项</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 当前为演示版本，仅支持简单背景移除</li>
                <li>• 实际应用中需要集成专业的AI抠图服务</li>
                <li>• 复杂背景可能需要手动调整</li>
                <li>• 建议图片大小不超过10MB</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bg-checkered {
          background-image:
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
        .dark .bg-checkered {
          background-image:
            linear-gradient(45deg, #374151 25%, transparent 25%),
            linear-gradient(-45deg, #374151 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #374151 75%),
            linear-gradient(-45deg, transparent 75%, #374151 75%);
        }
      `}</style>
    </div>
  );
}