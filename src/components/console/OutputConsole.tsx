"use client";

import { Button, message } from "antd";
import { CopyOutlined, DownloadOutlined } from "@ant-design/icons";
import { usePlcStore } from "../../store/plcStore";

export default function OutputConsole() {
    const { instructionList } = usePlcStore();

    const handleCopy = () => {
        navigator.clipboard.writeText(instructionList);
        message.success("Copied to clipboard!");
    };

    const handleExport = () => {
        const blob = new Blob([instructionList], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Mitsubishi_PLC_Logic.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        message.success("Exported logic file!");
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--foreground)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--panel-bg)', padding: '8px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ backgroundColor: '#10b981', width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block' }}></span>
                    Output Console
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        size="small"
                        type="text"
                        icon={<CopyOutlined />}
                        onClick={handleCopy}
                        style={{ color: '#94a3b8' }}
                        disabled={!instructionList}
                    >
                        Copy
                    </Button>
                    <Button
                        size="small"
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleExport}
                        style={{ backgroundColor: 'var(--accent-cyan)', color: 'var(--background)', fontWeight: 600, border: 'none' }}
                        disabled={!instructionList}
                    >
                        Export
                    </Button>
                </div>
            </div>

            <div style={{ padding: '16px', flexGrow: 1, overflow: 'auto', fontFamily: 'var(--font-mono)', fontSize: '14px', backgroundColor: 'var(--background)' }}>
                {!instructionList ? (
                    <div style={{ color: '#475569', fontStyle: 'italic' }}>
                        &gt; Waiting for output...
                    </div>
                ) : (
                    <pre style={{ color: 'var(--accent-cyan)', lineHeight: 1.6, margin: 0 }}>{instructionList}</pre>
                )}
            </div>
        </div>
    );
}
