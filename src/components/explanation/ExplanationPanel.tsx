"use client";

import { InfoCircleOutlined } from "@ant-design/icons";
import { usePlcStore } from "../../store/plcStore";

export default function ExplanationPanel() {
    const { explanation } = usePlcStore();

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', backgroundColor: 'var(--panel-bg)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfoCircleOutlined /> AI Explanation
            </h2>

            {!explanation ? (
                <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginTop: '40px', padding: '16px', border: '1px dashed var(--border-color)', borderRadius: '4px' }}>
                    Waiting for logic generation...
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: 'var(--background)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ color: 'var(--foreground)', fontSize: '14px', margin: '0 0 8px 0', fontWeight: 600 }}>Logic Overview</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '14px', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.6 }}>
                            {explanation}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
