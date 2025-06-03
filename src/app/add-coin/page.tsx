'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import { ArrowLeft, Upload, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AddCoin() {
  const [formData, setFormData] = useState({
    coinNo: '',
    value: '',
    material: '',
    country: '',
    year: '',
    mint: '',
    coinPresentValue: '',
    description: '',
    remark: '',
  });
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [coinNoExists, setCoinNoExists] = useState(false);
  const [checkingCoinNo, setCheckingCoinNo] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const compressImage = async (file: File): Promise<string> => {
    const img = new Image();
    const reader = new FileReader();
    reader.readAsDataURL(file);

    return new Promise((resolve) => {
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        const sizeInMB = (base64String.length * 3) / 4 / (1024 * 1024);

        if (sizeInMB <= 0.3) {
          resolve(base64String);
          return;
        }

        img.src = base64String;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          const maxDim = 512;
          let { width, height } = img;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL(file.type, 0.5);
          resolve(compressedBase64);
        };
      };
    });
  };

  const estimateDocumentSize = (data: any): number => {
    const jsonString = JSON.stringify(data);
    return new TextEncoder().encode(jsonString).length;
  };

  const checkCoinNoExists = async (coinNo: string) => {
    if (!coinNo) {
      setCoinNoExists(false);
      return;
    }

    setCheckingCoinNo(true);
    try {
      const q = query(collection(db, 'coins'), where('coinNo', '==', coinNo));
      const querySnapshot = await getDocs(q);
      setCoinNoExists(!querySnapshot.empty);
    } catch (error) {
      console.error('Error checking Coin No:', error);
      setCoinNoExists(false);
    } finally {
      setCheckingCoinNo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (coinNoExists) {
      alert('A coin with this Coin No already exists.');
      return;
    }

    setLoading(true);
    setSizeError(null);

    try {
      const photos: string[] = [];
      if (frontImage) photos.push(frontImage);
      if (backImage) photos.push(backImage);

      const documentData = {
        ...formData,
        photos,
        createdAt: new Date().toISOString(),
      };

      const docSize = estimateDocumentSize(documentData);
      const maxSize = 1048576;
      if (docSize > maxSize) {
        throw new Error(
          `Document size (${(docSize / 1024).toFixed(2)} KB) exceeds Firestore limit of 1 MB. Please use smaller images.`
        );
      }

      await addDoc(collection(db, 'coins'), documentData);

      alert('Coin added successfully!');
      setFormData({
        coinNo: '',
        value: '',
        material: '',
        country: '',
        year: '',
        mint: '',
        coinPresentValue: '',
        description: '',
        remark: '',
      });
      setFrontImage(null);
      setBackImage(null);
      (document.getElementById('frontImage') as HTMLInputElement).value = '';
      (document.getElementById('backImage') as HTMLInputElement).value = '';
      setCoinNoExists(false);
    } catch (error: any) {
      console.error('Error adding coin:', error);
      if (error.message.includes('Document size')) {
        setSizeError(error.message);
      } else {
        alert('Failed to add coin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'coinNo') {
      checkCoinNoExists(value);
    }
  };

  const handleFrontImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressedBase64 = await compressImage(e.target.files[0]);
      setFrontImage(compressedBase64);
    }
  };

  const handleBackImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressedBase64 = await compressImage(e.target.files[0]);
      setBackImage(compressedBase64);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative max-w-md w-full bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors duration-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8"
        >
          Add Coin Details
        </motion.h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Coin No</label>
            <div className="relative">
              <input
                type="text"
                name="coinNo"
                value={formData.coinNo}
                onChange={handleInputChange}
                className={`w-full p-3 rounded-lg bg-white/60 border ${
                  coinNoExists ? 'border-red-400' : 'border-gray-200/50'
                } shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800`}
                placeholder="Enter Coin No"
                required
              />
              {checkingCoinNo && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="animate-spin h-5 w-5 text-indigo-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                </div>
              )}
            </div>
            {coinNoExists && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-sm text-red-600 flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" />
                Coin with this Coin No already exists
              </motion.p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Front Image</label>
            <div className="relative">
              <input
                id="frontImage"
                type="file"
                accept="image/*"
                onChange={handleFrontImageChange}
                className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 text-gray-800 opacity-0 absolute inset-0 z-10 cursor-pointer"
              />
              <div className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm flex items-center justify-between text-gray-500">
                <span>{frontImage ? 'Front image selected' : 'Choose front image'}</span>
                <Upload className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Back Image</label>
            <div className="relative">
              <input
                id="backImage"
                type="file"
                accept="image/*"
                onChange={handleBackImageChange}
                className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 text-gray-800 opacity-0 absolute inset-0 z-10 cursor-pointer"
              />
              <div className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm flex items-center justify-between text-gray-500">
                <span>{backImage ? 'Back image selected' : 'Choose back image'}</span>
                <Upload className="w-5 h-5 text-indigo-500" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
            <input
              type="text"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Enter coin value"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
            <input
              type="text"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Enter material"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Enter country"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
            <input
              type="text"
              name="year"
              value={formData.year}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Enter year"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Mint</label>
            <input
              type="text"
              name="mint"
              value={formData.mint}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Enter mint"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Coin Present Value</label>
            <input
              type="text"
              name="coinPresentValue"
              value={formData.coinPresentValue}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Enter present value"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800 resize-none"
              placeholder="Describe the coin"
              rows={3}
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
            <input
              type="text"
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
              placeholder="Add a remark (optional)"
            />
          </motion.div>

          {sizeError && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {sizeError}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading || coinNoExists}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Adding...
              </>
            ) : (
              'Add Coin'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}