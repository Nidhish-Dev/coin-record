'use client';

import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import jsPDF from 'jspdf';

type Coin = {
  id: string;
  coinNo: string;
  photos: string[];
  value: string;
  material: string;
  country: string;
  year: string;
  mint: string;
  coinPresentValue: string;
  description: string;
  remark: string;
  createdAt: string;
};

export default function CoinRecords() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentImages, setCurrentImages] = useState<{ [key: string]: number }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const coinsPerPage = 6;

  useEffect(() => {
    const fetchCoins = async () => {
      const q = query(collection(db, 'coins'), orderBy(sortBy, sortOrder as 'asc' | 'desc'));
      const querySnapshot = await getDocs(q);
      const coinData: Coin[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Coin));
      setCoins(coinData);
      setFilteredCoins(coinData);
    };
    fetchCoins();
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const filtered = coins.filter(coin =>
      (coin.coinNo ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coin.country ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (coin.material ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCoins(filtered);
    setCurrentPage(1);
  }, [searchTerm, coins]);

  const handleImageChange = (coinId: string, direction: 'next' | 'prev') => {
    setCurrentImages(prev => {
      const coin = coins.find(c => c.id === coinId);
      if (!coin) return prev;
      const currentIndex = prev[coinId] || 0;
      const newIndex =
        direction === 'next'
          ? (currentIndex + 1) % coin.photos.length
          : (currentIndex - 1 + coin.photos.length) % coin.photos.length;
      return { ...prev, [coinId]: newIndex };
    });
  };

  const totalPages = Math.ceil(filteredCoins.length / coinsPerPage);
  const paginatedCoins = filteredCoins.slice(
    (currentPage - 1) * coinsPerPage,
    currentPage * coinsPerPage
  );

  const handlePageChange = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    } else if (direction === 'prev' && currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(20);
    doc.text('Coin Records', 105, yPosition, { align: 'center' });
    yPosition += 15;

    for (const [index, coin] of filteredCoins.entries()) {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`Coin ${index + 1}`, 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.text(`Coin No: ${coin.coinNo ?? 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Value: ${coin.value}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Material: ${coin.material ?? 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Country: ${coin.country ?? 'N/A'}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Year: ${coin.year}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Mint: ${coin.mint}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Present Value: ${coin.coinPresentValue}`, 20, yPosition);
      yPosition += 6;
      doc.text(`Description: ${coin.description}`, 20, yPosition, { maxWidth: 170 });
      yPosition += 10;
      doc.text(`Remark: ${coin.remark || 'N/A'}`, 20, yPosition);
      yPosition += 10;

      if (coin.photos.length > 0) {
        try {
          doc.addImage(coin.photos[0], 'JPEG', 20, yPosition, 50, 50);
          if (coin.photos.length > 1) {
            doc.addImage(coin.photos[1], 'JPEG', 80, yPosition, 50, 50);
          }
          yPosition += 60;
        } catch (error) {
          console.error('Error adding image to PDF:', error);
          doc.text('Image unavailable', 20, yPosition);
          yPosition += 10;
        }
      }

      yPosition += 10;
    }

    doc.save(`coin-records-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-indigo-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative max-w-6xl w-full bg-white/30 backdrop-blur-xl rounded-2xl shadow-xl p-6 sm:p-8 border border-white/20"
      >
        <div className="flex justify-between items-center mb-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all duration-300"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-center text-gray-800 mb-8"
        >
          Coin Records
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-6 space-y-4"
        >
          <input
            type="text"
            placeholder="Search by Coin No, Country, or Material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 placeholder-gray-400 text-gray-800"
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-auto p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="createdAt">Sort by Date</option>
              <option value="year">Sort by Year</option>
              <option value="coinPresentValue">Sort by Present Value</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full sm:w-auto p-3 rounded-lg bg-white/60 border border-gray-200/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-300 text-gray-800"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {paginatedCoins.map(coin => (
            <motion.div
              key={coin.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/20 backdrop-blur-lg rounded-lg p-4 shadow-lg border border-white/20"
            >
              <div className="relative">
                <img
                  src={coin.photos[currentImages[coin.id] || 0]}
                  alt="Coin"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {coin.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageChange(coin.id, 'prev')}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleImageChange(coin.id, 'next')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition-all duration-300"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-4 space-y-2 text-gray-800">
                <p><strong>Coin No:</strong> {coin.coinNo ?? 'N/A'}</p>
                <p><strong>Value:</strong> {coin.value}</p>
                <p><strong>Material:</strong> {coin.material ?? 'N/A'}</p>
                <p><strong>Country:</strong> {coin.country ?? 'N/A'}</p>
                <p><strong>Year:</strong> {coin.year}</p>
                <p><strong>Mint:</strong> {coin.mint}</p>
                <p><strong>Present Value:</strong> {coin.coinPresentValue}</p>
                <p><strong>Description:</strong> {coin.description}</p>
                <p><strong>Remark:</strong> {coin.remark || 'N/A'}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {filteredCoins.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-4 mt-8"
          >
            <button
              onClick={() => handlePageChange('prev')}
              disabled={currentPage === 1}
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>
            <span className="text-gray-800 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange('next')}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}