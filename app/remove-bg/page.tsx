"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface ProcessingStats {
  originalSize: number;
  processedSize: number;
  processingTime: number;
}

export default function RemoveBgPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingStats, setProcessingStats] = useState<ProcessingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的图片格式
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];
  const maxFileSize = 12 * 1024 * 1024; // 12MB (remove.bg 限制)
  const REMOVE_BG_API_KEY = '6vLW8CGQXVzu1LkumucPSAq8';

  const validateFile = (file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return '不支持的文件格式。请选择 JPG、PNG 或 BMP 格式的图片。';
    }
    if (file.size > maxFileSize) {
      return '文件大小超过限制。请选择小于 12MB 的图片。';
    }
    return null;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setProcessedUrl(null);
      setProcessingStats(null);
      setError(null);
      setProgress(0);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setSelectedFile(file);
      setProcessedUrl(null);
      setProcessingStats(null);
      setError(null);
      setProgress(0);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const removeBackground = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setProgress(0);

    const startTime = Date.now();

    try {
      // 创建进度更新模拟
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      // 准备 FormData 发送到 remove.bg API
      const formData = new FormData();
      formData.append('image_file', selectedFile);
      formData.append('size', 'auto');

      // 调用 remove.bg API
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors?.[0]?.title || `API 请求失败: ${response.status}`);
      }

      // 获取处理后的图片
      const blob = await response.blob();
      const processedDataUrl = URL.createObjectURL(blob);

      const processingTime = Date.now() - startTime;

      setProcessedUrl(processedDataUrl);
      setProcessingStats({
        originalSize: selectedFile.size,
        processedSize: blob.size,
        processingTime
      });
      setLoading(false);

    } catch (error) {
      console.error('背景移除失败:', error);
      setError(error instanceof Error ? error.message : 'API 调用失败，请检查网络连接或稍后重试');
      setLoading(false);
      setProgress(0);
    }
  };

  const downloadProcessed = () => {
    if (!processedUrl || !selectedFile) return;

    const link = document.createElement('a');
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${originalName}_no_bg.png`;
    link.href = processedUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 清理 object URL
    URL.revokeObjectURL(processedUrl);
  };

  const resetAll = () => {
    if (processedUrl) {
      URL.revokeObjectURL(processedUrl);
    }
    setSelectedFile(null);
    setProcessedUrl(null);
    setProcessingStats(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
              AI 抠图去背景
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              专业级 AI 技术，精准识别主体，一键去除图片背景，制作透明背景图片
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 dark:text-red-400">{error}</span>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
            {!selectedFile ? (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mb-4">
                  <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {isDragging ? '释放文件进行上传' : '拖拽图片到这里或点击选择'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  支持 JPG、PNG、BMP 格式，最大 12MB
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">JPG</span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">PNG</span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">BMP</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.bmp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-8">
                {/* 文件信息 */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">文件信息</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">文件名：</span>
                      <p className="font-medium text-gray-900 dark:text-white truncate">{selectedFile.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">文件大小：</span>
                      <p className="font-medium text-gray-900 dark:text-white">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">文件类型：</span>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFile.type}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">修改时间：</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(selectedFile.lastModified).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 预览区域 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 原图预览 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      原图
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="原图"
                        className="w-full h-auto max-h-80 object-contain rounded"
                      />
                      <div className="mt-3 flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">文件大小</span>
                        <span className="font-medium text-gray-900 dark:text-white">{formatFileSize(selectedFile.size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 处理后预览 */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      处理结果
                    </h3>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-checkered">
                      {loading ? (
                        <div className="flex flex-col items-center justify-center h-80">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">AI 正在处理中...</p>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 max-w-xs">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{Math.round(progress)}%</p>
                        </div>
                      ) : processedUrl ? (
                        <>
                          <div className="relative">
                            <img
                              src={processedUrl}
                              alt="去背景后"
                              className="w-full h-auto max-h-80 object-contain rounded"
                            />
                            <div className="absolute top-2 right-2 bg-white dark:bg-gray-800 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 shadow">
                              透明背景
                            </div>
                          </div>
                          <div className="mt-3 space-y-2">
                            {processingStats && (
                              <>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">处理后大小</span>
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {formatFileSize(processingStats.processedSize)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">处理时间</span>
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    {(processingStats.processingTime / 1000).toFixed(1)}s
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400">
                          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p>点击"开始去背景"处理图片</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={removeBackground}
                    disabled={loading}
                    className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        处理中...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        开始去背景
                      </>
                    )}
                  </button>

                  {processedUrl && (
                    <button
                      onClick={downloadProcessed}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      下载PNG图片
                    </button>
                  )}

                  <button
                    onClick={resetAll}
                    className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    重新选择
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 处理统计 */}
          {processingStats && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                处理统计
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatFileSize(processingStats.originalSize)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">原始大小</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatFileSize(processingStats.processedSize)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">处理后大小</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {(processingStats.processingTime / 1000).toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">处理时间</div>
                </div>
              </div>
            </div>
          )}

          {/* 功能说明 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">AI 技术</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 使用专业级 remove.bg API</li>
                <li>• 深度学习算法精准识别</li>
                <li>• 支持复杂背景和细节处理</li>
                <li>• 保留头发丝等精细边缘</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">适用场景</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 电商产品图制作</li>
                <li>• 证件照背景更换</li>
                <li>• 社交媒体头像处理</li>
                <li>• 设计素材制作</li>
              </ul>
            </div>

            <div className="bg-purple-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">使用建议</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 主体清晰的图片效果更佳</li>
                <li>• 建议使用高分辨率图片</li>
                <li>• 避免主体与背景色彩过于相近</li>
                <li>• 人像和产品图处理效果最佳</li>
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