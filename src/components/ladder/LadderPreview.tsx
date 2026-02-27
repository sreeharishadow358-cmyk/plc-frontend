"use client";

import { usePlcStore } from "../../store/plcStore";

export default function LadderPreview() {
    const { ladderData } = usePlcStore();

    return (
        <div className="engineering-grid" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden', padding: '16px' }}>
            <div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Ladder Logic Preview
                </h2>
                {ladderData.length > 0 && (
                    <span style={{ fontSize: '12px', backgroundColor: 'var(--accent-cyan)', color: 'var(--background)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        Generated
                    </span>
                )}
            </div>

            <div style={{ flexGrow: 1, overflow: 'auto', zIndex: 10 }}>
                {ladderData.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#64748b' }}>
                        <svg style={{ width: '64px', height: '64px', marginBottom: '16px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>Enter instructions and click generate to view ladder logic.</p>
                    </div>
                ) : (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', position: 'relative' }}>
                        <div style={{ marginBottom: '16px', color: 'var(--accent-cyan)' }}>Rung 000:</div>
                        <div style={{ display: 'flex', alignItems: 'center', borderLeft: '2px solid #3b82f6', borderRight: '2px solid #3b82f6', padding: '32px 16px', position: 'relative', gap: '32px' }}>
                            {/* Rung Wire */}
                            <div style={{ position: 'absolute', left: '4px', right: '4px', height: '2px', backgroundColor: '#3b82f6', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}></div>

                            {ladderData.map((node, i) => (
                                <div key={i} style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--background)', padding: '0 8px' }}>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{node.label}</div>
                                    {node.type === "contact" && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--foreground)' }}>
                                            <span>-|</span> <span>|-</span>
                                        </div>
                                    )}
                                    {node.type === "contact_nc" && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--foreground)' }}>
                                            <span>-|</span><span style={{ color: '#ef4444' }}>/</span><span>|-</span>
                                        </div>
                                    )}
                                    {node.type === "coil" && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                                            <span>-(</span> <span>)-</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
