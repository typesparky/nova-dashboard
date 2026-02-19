import { useState, useCallback, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Upload, FileText, Table, BarChart3, X, AlertCircle } from 'lucide-react';

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [], error: 'File must have at least 2 rows (header + data)' };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((h, idx) => {
                const num = parseFloat(values[idx]);
                row[h] = isNaN(num) ? values[idx] : num;
            });
            rows.push(row);
        }
    }
    return { headers, rows, error: null };
}

function parseJSON(text) {
    try {
        const data = JSON.parse(text);
        if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            return { headers, rows: data, error: null };
        }
        return { headers: [], rows: [], error: 'JSON must be an array of objects' };
    } catch {
        return { headers: [], rows: [], error: 'Invalid JSON format' };
    }
}

export default function LocalVault() {
    const [parsedData, setParsedData] = useState(null);
    const [fileName, setFileName] = useState('');
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'chart'

    const handleFile = useCallback((file) => {
        setError('');
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            let result;
            if (file.name.endsWith('.json')) {
                result = parseJSON(text);
            } else {
                result = parseCSV(text);
            }
            if (result.error) {
                setError(result.error);
                setParsedData(null);
            } else {
                setParsedData(result);
                setViewMode('table');
            }
        };
        reader.onerror = () => {
            setError('[SYS ERR] Failed to read file');
            setParsedData(null);
        };
        reader.readAsText(file);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => setIsDragging(false), []);

    const handleInputChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    // Find first two numerical columns for chart
    const chartConfig = useMemo(() => {
        if (!parsedData || parsedData.rows.length === 0) return null;
        const numCols = parsedData.headers.filter(h =>
            parsedData.rows.some(r => typeof r[h] === 'number')
        );
        if (numCols.length < 1) return null;
        const labelCol = parsedData.headers.find(h =>
            parsedData.rows.every(r => typeof r[h] === 'string')
        ) || parsedData.headers[0];
        return { labelCol, numCols: numCols.slice(0, 4) };
    }, [parsedData]);

    const CHART_COLORS = ['#00d4ff', '#00ff88', '#ff3366', '#ffcc00'];

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="border-b border-terminal-border bg-terminal-card px-3 py-2">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] text-text-secondary uppercase tracking-wider">
                        Local Vault — Proprietary Data Module
                    </div>
                    {parsedData && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${viewMode === 'table'
                                        ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                                        : 'text-text-muted hover:text-text-secondary border border-transparent'
                                    }`}
                            >
                                <Table size={9} /> Table
                            </button>
                            <button
                                onClick={() => setViewMode('chart')}
                                disabled={!chartConfig}
                                className={`text-[10px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${viewMode === 'chart'
                                        ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
                                        : 'text-text-muted hover:text-text-secondary border border-transparent'
                                    } ${!chartConfig ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                <BarChart3 size={9} /> Chart
                            </button>
                            <button
                                onClick={() => { setParsedData(null); setFileName(''); setError(''); }}
                                className="text-[10px] px-2 py-0.5 rounded text-text-muted hover:text-neon-red border border-transparent flex items-center gap-1 transition-colors"
                            >
                                <X size={9} /> Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {!parsedData && !error && (
                    /* Drop Zone */
                    <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={`h-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isDragging
                                ? 'border-neon-cyan bg-neon-cyan/5'
                                : 'border-terminal-border hover:border-text-muted'
                            }`}
                    >
                        <Upload size={32} className={`mb-3 ${isDragging ? 'text-neon-cyan' : 'text-text-muted'}`} />
                        <div className="text-sm text-text-secondary mb-1">
                            Drop CSV or JSON file here
                        </div>
                        <div className="text-[10px] text-text-muted mb-4">
                            or click to browse
                        </div>
                        <label className="bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded px-4 py-1.5 text-[10px] uppercase font-bold hover:bg-neon-cyan/20 transition-colors cursor-pointer">
                            <input
                                type="file"
                                accept=".csv,.json"
                                onChange={handleInputChange}
                                className="hidden"
                            />
                            Select File
                        </label>
                        <div className="mt-4 text-[9px] text-text-muted">
                            {'>'} Supported formats: .csv, .json<br />
                            {'>'} Data is processed locally — never uploaded<br />
                            {'>'} Auto-generates table view + line chart
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-neon-red/5 border border-neon-red/20 rounded-md p-4">
                        <div className="flex items-center gap-2 text-neon-red text-xs mb-2">
                            <AlertCircle size={12} />
                            <span className="font-bold">Parse Error</span>
                        </div>
                        <div className="text-text-secondary text-[11px]">{error}</div>
                        <button
                            onClick={() => { setError(''); setParsedData(null); setFileName(''); }}
                            className="mt-3 text-[10px] text-neon-cyan hover:underline"
                        >
                            {'>'} Try another file
                        </button>
                    </div>
                )}

                {parsedData && viewMode === 'table' && (
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-[10px]">
                            <FileText size={10} className="text-neon-cyan" />
                            <span className="text-text-secondary">{fileName}</span>
                            <span className="text-text-muted">— {parsedData.rows.length} rows × {parsedData.headers.length} cols</span>
                        </div>
                        <div className="overflow-auto max-h-full">
                            <table>
                                <thead>
                                    <tr>
                                        <th className="text-text-muted">#</th>
                                        {parsedData.headers.map(h => (
                                            <th key={h}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.rows.map((row, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02]">
                                            <td className="text-text-muted">{i + 1}</td>
                                            {parsedData.headers.map(h => (
                                                <td key={h} className={typeof row[h] === 'number' ? 'text-neon-cyan font-bold text-right' : 'text-text-primary'}>
                                                    {typeof row[h] === 'number' ? row[h].toLocaleString() : row[h]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {parsedData && viewMode === 'chart' && chartConfig && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-2 text-[10px]">
                            <BarChart3 size={10} className="text-neon-cyan" />
                            <span className="text-text-secondary">{fileName}</span>
                            <span className="text-text-muted">— Charting: {chartConfig.numCols.join(', ')}</span>
                        </div>
                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={parsedData.rows} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2a36" />
                                    <XAxis
                                        dataKey={chartConfig.labelCol}
                                        stroke="#4a5568"
                                        tick={{ fontSize: 9, fill: '#7a8a9e' }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        stroke="#4a5568"
                                        tick={{ fontSize: 9, fill: '#7a8a9e' }}
                                        width={60}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#111820',
                                            border: '1px solid #1e2a36',
                                            fontSize: '11px',
                                        }}
                                    />
                                    {chartConfig.numCols.map((col, i) => (
                                        <Line
                                            key={col}
                                            type="monotone"
                                            dataKey={col}
                                            stroke={CHART_COLORS[i]}
                                            strokeWidth={1.5}
                                            dot={false}
                                            name={col}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-terminal-border bg-terminal-card px-3 py-1.5 text-[9px] text-text-muted flex items-center justify-between">
                <span>Nova Capital — Proprietary Data Staging Area</span>
                <span>All processing performed client-side</span>
            </div>
        </div>
    );
}
