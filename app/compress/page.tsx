"use client";

import { useState, useRef } from "react";
import Link from "next/link";

export default function CompressPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [quality, setQuality] = useState(80);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setCompressedUrl(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setCompressedUrl(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const compressImage = async () => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        ctx?.drawImage(img, 0, 0);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality / 100);
        setCompressedUrl(compressedDataUrl);
        setLoading(false);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error('压缩失败:', error);
      setLoading(false);
    }
  };

  const downloadCompressed = () => {
    if (!compressedUrl) return;

    const link = document.createElement('a');
    link.download = `compressed_${selectedFile?.name || 'image'}.jpg`;
    link.href = compressedUrl;
    link.click();
  };

  const resetAll = () => {
    setSelectedFile(null);
    setCompressedUrl(null);
    setQuality(80);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
              图片压缩
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              智能压缩图片文件大小，保持高质量的同时减少存储空间
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 mb-8">
            {!selectedFile ? (
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">原图</h3>
                    <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="原图"
                        className="w-full h-auto max-h-64 object-contain"
                      />
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        大小: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>

                  {compressedUrl && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">压缩后</h3>
                      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <img
                          src={compressedUrl}
                          alt="压缩后"
                          className="w-full h-auto max-h-64 object-contain"
                        />
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          压缩质量: {quality}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      压缩质量: {quality}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>高压缩</span>
                      <span>高质量</span>
                    </div>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={compressImage}
                      disabled={loading}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
                    >
                      {loading ? '压缩中...' : '开始压缩'}
                    </button>

                    {compressedUrl && (
                      <button
                        onClick={downloadCompressed}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                      >
                        下载压缩图片
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
              </div>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">使用说明</h3>
            <ul className="text-gray-600 dark:text-gray-300 space-y-2">
              <li>• 支持 JPG、PNG、GIF 等常见图片格式</li>
              <li>• 可以通过拖拽或点击选择图片文件</li>
              <li>• 调整压缩质量滑块来控制压缩程度</li>
              <li>• 质量越低，文件越小，但图片质量会下降</li>
              <li>• 压缩完成后可以下载处理后的图片</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}