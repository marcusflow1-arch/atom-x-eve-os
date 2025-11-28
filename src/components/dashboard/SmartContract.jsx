import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, Zap, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SmartContract({ contract, onAccept, onReject }) {
  const [clientSigned, setClientSigned] = useState(false);
  const [workerSigned, setWorkerSigned] = useState(false);

  const handleSign = (party) => {
    if (party === 'worker') {
      setWorkerSigned(true);
    }
    
    if (clientSigned && party === 'worker') {
      // Both signed - activate contract
      setTimeout(() => onAccept(), 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border-2 border-blue-500/50 max-w-5xl w-full p-8 relative overflow-hidden"
      >
        {/* Holographic Effect */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cartographer.png')] opacity-5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <h2 className="text-3xl font-black text-white mb-2">SMART CONTRACT</h2>
          <p className="text-blue-400">Digital Agreement Protocol</p>
          <Badge className="mt-2 bg-green-500/20 text-green-400 border-green-500/50">
            <Zap className="w-3 h-3 mr-1" />
            AI Verified
          </Badge>
        </div>

        {/* Main Content - 3 Columns */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Left - Client */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-4xl mb-3 border-4 border-blue-500/50">
                {contract?.client?.avatar || '👤'}
              </div>
              <h3 className="text-white font-bold">{contract?.client?.name || 'Client'}</h3>
              <Badge className="mt-1 bg-blue-500/20 text-blue-400">Requestor</Badge>
            </div>
            
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-slate-400 text-xs mb-2">OFFERING</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">Tokens</span>
                  <span className="text-yellow-400 font-bold">{contract?.reward?.tokens || 1}</span>
                </div>
                {contract?.reward?.item && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Item</span>
                    <span className="text-purple-400 font-bold">{contract?.reward?.item}</span>
                  </div>
                )}
              </div>
            </div>

            {clientSigned ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">SIGNED</span>
              </div>
            ) : (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">Awaiting Signature</span>
              </div>
            )}
          </div>

          {/* Center - Contract Terms */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border-2 border-blue-500/30 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
              
              <div className="relative space-y-4">
                <div>
                  <h4 className="text-blue-400 text-xs font-semibold mb-1 flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    OBJECTIVE
                  </h4>
                  <p className="text-white font-bold">{contract?.objective || 'Complete Task'}</p>
                </div>

                <div>
                  <h4 className="text-purple-400 text-xs font-semibold mb-1 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    DURATION CAP
                  </h4>
                  <p className="text-white">{contract?.duration || '2 Hours'} Maximum</p>
                </div>

                <div>
                  <h4 className="text-green-400 text-xs font-semibold mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    REWARD
                  </h4>
                  <p className="text-white">
                    {contract?.reward?.tokens || 1} Token{contract?.reward?.tokens > 1 ? 's' : ''}
                    {contract?.reward?.item && ` + ${contract?.reward?.item}`}
                  </p>
                </div>

                <div>
                  <h4 className="text-red-400 text-xs font-semibold mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    FAILURE CONDITION
                  </h4>
                  <p className="text-white text-sm">
                    {contract?.failureCondition || 'If objective not met, only 50% of tokens paid'}
                  </p>
                </div>
              </div>
            </div>

            {/* Handshake Chain */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: clientSigned && workerSigned ? 1 : 0 }}
                className="flex items-center gap-2 text-green-400"
              >
                <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
                <div className="text-2xl">🤝</div>
                <div className="w-8 h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              </motion.div>
            </div>
          </div>

          {/* Right - Worker */}
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-4xl mb-3 border-4 border-purple-500/50">
                {contract?.worker?.avatar || '⚔️'}
              </div>
              <h3 className="text-white font-bold">{contract?.worker?.name || 'Mercenary'}</h3>
              <Badge className="mt-1 bg-purple-500/20 text-purple-400">Service Provider</Badge>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <h4 className="text-slate-400 text-xs mb-2">REPUTATION</h4>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-300 text-sm">Success Rate</span>
                <span className="text-green-400 font-bold">{contract?.worker?.successRate || '95%'}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((star) => (
                  <span key={star} className="text-yellow-400">★</span>
                ))}
              </div>
            </div>

            {workerSigned ? (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">SIGNED</span>
              </div>
            ) : (
              <Button
                onClick={() => handleSign('worker')}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Sign Contract
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={onReject}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Decline
          </Button>
        </div>

        {/* Status Message */}
        {clientSigned && workerSigned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
              <p className="text-green-400 font-semibold">Contract Active! Starting mission tracking...</p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}