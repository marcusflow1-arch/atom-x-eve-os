import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, RefreshCw, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

/**
 * Admin panel for security audits and dependency monitoring
 */
export default function SecurityAuditPanel() {
    const [auditResult, setAuditResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const runAudit = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('securityAudit');
            setAuditResult(response.audit);
        } catch (error) {
            console.error('Audit failed:', error);
            setAuditResult({
                status: 'error',
                message: error.message
            });
        }
        setLoading(false);
    };

    const getSeverityColor = (severity) => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
            case 'moderate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
            case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Shield className="w-7 h-7 text-blue-400" />
                        Security Audit
                    </h2>
                    <p className="text-white/50 text-sm">Dependency vulnerability scanning and compliance checks</p>
                </div>
                <Button 
                    onClick={runAudit}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Scanning...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4 mr-2" />
                            Run Audit
                        </>
                    )}
                </Button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-2 text-sm">Local Audit</h3>
                    <p className="text-white/40 text-xs mb-3">Run in your terminal:</p>
                    <code className="bg-black/40 text-green-400 text-xs px-3 py-2 rounded block font-mono">
                        npm audit
                    </code>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-2 text-sm">Auto Fix</h3>
                    <p className="text-white/40 text-xs mb-3">Fix vulnerabilities:</p>
                    <code className="bg-black/40 text-green-400 text-xs px-3 py-2 rounded block font-mono">
                        npm audit fix
                    </code>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <h3 className="text-white font-semibold mb-2 text-sm">Lockfile</h3>
                    <p className="text-white/40 text-xs mb-3">Ensure reproducible builds:</p>
                    <code className="bg-black/40 text-green-400 text-xs px-3 py-2 rounded block font-mono">
                        npm ci
                    </code>
                </div>
            </div>

            {/* Audit Results */}
            {auditResult && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/50 border border-white/10 rounded-xl p-6"
                >
                    {auditResult.status === 'error' ? (
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                            <div>
                                <p className="font-bold">Audit Failed</p>
                                <p className="text-sm text-white/50">{auditResult.message}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Summary */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-green-400" />
                                    <div>
                                        <p className="text-white font-bold">Audit Complete</p>
                                        <p className="text-white/40 text-xs">
                                            {new Date(auditResult.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vulnerability Summary */}
                            <div className="grid grid-cols-5 gap-3 mb-6">
                                {['critical', 'high', 'moderate', 'low', 'info'].map(severity => (
                                    <div key={severity} className="text-center p-4 bg-white/5 rounded-lg">
                                        <div className={`text-2xl font-bold mb-1 ${
                                            severity === 'critical' ? 'text-red-400' :
                                            severity === 'high' ? 'text-orange-400' :
                                            severity === 'moderate' ? 'text-yellow-400' :
                                            'text-blue-400'
                                        }`}>
                                            {auditResult.summary[severity]}
                                        </div>
                                        <div className="text-white/40 text-xs uppercase">{severity}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Recommendations */}
                            <div>
                                <h3 className="text-white font-bold mb-3">Recommendations</h3>
                                <ul className="space-y-2">
                                    {auditResult.recommendations.map((rec, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-white/70">
                                            <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                </motion.div>
            )}

            {/* External Resources */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Security Resources
                </h3>
                <div className="space-y-3">
                    <a 
                        href="https://docs.npmjs.com/cli/v9/commands/npm-audit" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                        <span className="text-white/70 group-hover:text-white text-sm">npm audit documentation</span>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                    </a>
                    <a 
                        href="https://snyk.io/vuln/" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                        <span className="text-white/70 group-hover:text-white text-sm">Snyk Vulnerability Database</span>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                    </a>
                    <a 
                        href="https://docs.github.com/en/code-security/dependabot" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
                    >
                        <span className="text-white/70 group-hover:text-white text-sm">Dependabot Setup Guide</span>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-white" />
                    </a>
                </div>
            </div>
        </div>
    );
}