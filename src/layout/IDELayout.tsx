"use client";

import { Layout } from 'antd';
import InstructionEditor from '../components/editor/InstructionEditor';
import LadderPreview from '../components/ladder/LadderPreview';
import ExplanationPanel from '../components/explanation/ExplanationPanel';
import OutputConsole from '../components/console/OutputConsole';

const { Header, Sider, Content, Footer } = Layout;

export default function IDELayout() {
    return (
        <Layout style={{ height: '100vh', width: '100%' }}>
            {/* Header Panel */}
            <Header style={{ height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: '#06b6d4', color: '#0f172a', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>AI</div>
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>Mitsubishi PLC IDE</span>
                </div>
            </Header>

            <Layout hasSider>
                {/* Left Side: Editor (25%) */}
                <Sider width="25%" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <InstructionEditor />
                </Sider>

                {/* Center Side: Ladder Logic */}
                <Content style={{ position: 'relative', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        <LadderPreview />
                    </div>
                    {/* Bottom Side: Output Console (Fixed 200px) */}
                    <div style={{ height: '200px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--panel-bg)', overflow: 'hidden' }}>
                        <OutputConsole />
                    </div>
                </Content>

                {/* Right Side: AI Explanation & Warnings (25%) */}
                <Sider width="25%" style={{ overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <ExplanationPanel />
                </Sider>
            </Layout>

            {/* Status Bar */}
            <Footer style={{ height: '24px', padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                <span>System Ready | AI Engine Online</span>
            </Footer>
        </Layout>
    );
}
