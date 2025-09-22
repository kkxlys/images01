"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface RecognitionResult {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export default function ImageRecognitionPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      setError('');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      setError('');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const recognizeImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError('');

    try {
      // 将文件转换为base64
      const base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // 移除data:image/...;base64,前缀，只保留base64数据
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // 调用后端API
      const response = await fetch('/api/image-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData: base64String,
          prompt: "请详细分析这张图片的内容，包括主要物体、场景、颜色、构图等方面。"
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '识别失败');
      }

      setResult(data);
    } catch (error) {
      console.error('识别失败:', error);
      setError(error instanceof Error ? error.message : '识别失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSelectedFile(null);
    setResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              图片识别
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              AI智能分析图片内容，识别物体、文字、场景等信息
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer"
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
                  支持 JPG、PNG、GIF 等格式
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">待识别图片</h3>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="待识别图片"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        文件名: {selectedFile.name}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">识别结果</h3>
                    <div className="space-y-4">
                      {loading ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400">AI正在分析中...</p>
                        </div>
                      ) : error ? (
                        <div className="border border-red-200 dark:border-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                          <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">识别失败</h4>
                          <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
                        </div>
                      ) : result ? (
                        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">AI分析结果</h4>
                          <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
                            <p className="whitespace-pre-wrap">{result.content}</p>
                          </div>
                          {result.usage && (
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                              <div className="text-xs text-gray-500 dark:text-gray-400 space-x-4">
                                <span>消耗Token: {result.usage.total_tokens}</span>
                                <span>输入: {result.usage.prompt_tokens}</span>
                                <span>输出: {result.usage.completion_tokens}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          点击"开始识别"按钮分析图片
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 justify-center">
                  <button
                    onClick={recognizeImage}
                    disabled={loading}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {loading ? '识别中...' : '开始识别'}
                  </button>

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">物体识别</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                识别图片中的人物、动物、物品等各种实体对象
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">场景分析</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                分析图片的拍摄环境、场景类型和整体氛围
              </p>
            </div>

            <div className="bg-green-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">内容理解</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                深度理解图片内容，提供详细的描述和分析
              </p>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 dark:bg-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">功能说明</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <h4 className="font-medium mb-2">支持识别内容：</h4>
                <ul className="space-y-1">
                  <li>• 人物和面部特征</li>
                  <li>• 动物和植物</li>
                  <li>• 建筑和景观</li>
                  <li>• 物品和产品</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">分析维度：</h4>
                <ul className="space-y-1">
                  <li>• 主要物体识别</li>
                  <li>• 场景环境分析</li>
                  <li>• 颜色和构图</li>
                  <li>• 情感和氛围</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}