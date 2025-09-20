"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";

interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export default function CompressPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(80);
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的图片格式
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!supportedFormats.includes(file.type)) {
      return '不支持的文件格式。请选择 JPG、PNG 或 WebP 格式的图片。';
    }
    if (file.size > maxFileSize) {
      return '文件大小超过限制。请选择小于 10MB 的图片。';
    }
    return null;
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
      setCompressedUrl(null);
      setCompressionStats(null);
      setError(null);
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
      setCompressedUrl(null);
      setCompressionStats(null);
      setError(null);
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

  const compressImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建 Canvas 上下文');
      }

      const img = new Image();

      const processImage = () => {
        return new Promise<string>((resolve, reject) => {
          img.onload = () => {
            try {
              // 计算合适的画布尺寸，保持宽高比
              let { width, height } = img;
              const maxDimension = 2048; // 最大尺寸限制

              if (width > maxDimension || height > maxDimension) {
                const ratio = Math.min(maxDimension / width, maxDimension / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
              }

              canvas.width = width;
              canvas.height = height;

              // 使用高质量的图像渲染
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              // 绘制图像
              ctx.drawImage(img, 0, 0, width, height);

              // 根据原始文件类型选择输出格式
              const outputFormat = selectedFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
              const compressedDataUrl = canvas.toDataURL(outputFormat, quality / 100);

              resolve(compressedDataUrl);
            } catch (err) {
              reject(err);
            }
          };

          img.onerror = () => {
            reject(new Error('图片加载失败'));
          };
        });
      };

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          img.src = e.target?.result as string;
          const compressedDataUrl = await processImage();

          // 计算压缩统计信息
          const compressedSize = Math.round((compressedDataUrl.length * 3) / 4); // Base64 to bytes approximation
          const compressionRatio = ((selectedFile.size - compressedSize) / selectedFile.size) * 100;

          setCompressedUrl(compressedDataUrl);
          setCompressionStats({
            originalSize: selectedFile.size,
            compressedSize,
            compressionRatio: Math.max(0, compressionRatio)
          });
          setLoading(false);
        } catch (err) {
          console.error('压缩失败:', err);
          setError(err instanceof Error ? err.message : '压缩过程中发生错误');
          setLoading(false);
        }
      };

      reader.onerror = () => {
        setError('文件读取失败');
        setLoading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('压缩失败:', error);
      setError(error instanceof Error ? error.message : '压缩失败');
      setLoading(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedUrl || !selectedFile) return;

    const link = document.createElement('a');
    const fileExtension = selectedFile.type === 'image/png' ? 'png' : 'jpg';
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
    link.download = `compressed_${originalName}.${fileExtension}`;
    link.href = compressedUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setSelectedFile(null);
    setCompressedUrl(null);
    setCompressionStats(null);
    setQuality(80);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回首页
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              图片压缩工具
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              智能压缩图片文件大小，保持高质量的同时显著减少存储空间
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
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
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
                  支持 JPG、PNG、WebP 格式，最大 10MB
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">JPG</span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">PNG</span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">WebP</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
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

                {/* 压缩设置 */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="text-lg font-semibold text-gray-900 dark:text-white">
                        压缩质量: {quality}%
                      </label>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {quality >= 90 ? '极高质量' : quality >= 70 ? '高质量' : quality >= 50 ? '中等质量' : quality >= 30 ? '低质量' : '极低质量'}
                      </div>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                      <span>10% (最小文件)</span>
                      <span>50% (平衡)</span>
                      <span>100% (最高质量)</span>
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

                    {/* 压缩后预览 */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        压缩预览
                      </h3>
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700">
                        {loading ? (
                          <div className="flex flex-col items-center justify-center h-80">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400">正在压缩中...</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-4">
                              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                        ) : compressedUrl ? (
                          <>
                            <img
                              src={compressedUrl}
                              alt="压缩后"
                              className="w-full h-auto max-h-80 object-contain rounded"
                            />
                            <div className="mt-3 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">压缩后大小</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {compressionStats && formatFileSize(compressionStats.compressedSize)}
                                </span>
                              </div>
                              {compressionStats && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600 dark:text-gray-400">压缩率</span>
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    {compressionStats.compressionRatio.toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-80 text-gray-500 dark:text-gray-400">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 3v10a1 1 0 001 1h8a1 1 0 001-1V7M7 7h10M7 10h4m-4 3h2" />
                            </svg>
                            <p>点击"开始压缩"查看效果</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={compressImage}
                      disabled={loading}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          压缩中...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          开始压缩
                        </>
                      )}
                    </button>

                    {compressedUrl && (
                      <button
                        onClick={downloadCompressed}
                        className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        下载压缩图片
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
              </div>
            )}
          </div>

          {/* 压缩统计 */}
          {compressionStats && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                </svg>
                压缩统计
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatFileSize(compressionStats.originalSize)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">原始大小</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {formatFileSize(compressionStats.compressedSize)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">压缩后大小</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {compressionStats.compressionRatio.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">节省空间</div>
                </div>
              </div>
            </div>
          )}

          {/* 功能说明 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">功能特点</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 支持 JPG、PNG、WebP 等主流格式</li>
                <li>• 智能保持图片宽高比例</li>
                <li>• 高质量压缩算法</li>
                <li>• 实时预览压缩效果</li>
                <li>• 详细的压缩统计信息</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">使用建议</h3>
              <ul className="text-gray-600 dark:text-gray-300 space-y-2">
                <li>• 网页用图推荐 70-80% 质量</li>
                <li>• 社交媒体推荐 60-70% 质量</li>
                <li>• 存档备份推荐 85-95% 质量</li>
                <li>• 大文件可适当降低质量</li>
                <li>• PNG 图片压缩效果可能有限</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}