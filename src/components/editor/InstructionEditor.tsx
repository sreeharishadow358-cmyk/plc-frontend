"use client";

import { Input, Button } from "antd";
import { PlayCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import { usePlcStore } from "../../store/plcStore";
import { useGenerateLogic } from "../../hooks/useGenerateLogic";

export default function InstructionEditor() {
    const { inputText, setInputText, resetAll } = usePlcStore();
    const generateMutation = useGenerateLogic();

    const handleGenerate = () => {
        generateMutation.mutate(inputText);
    };

    return (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '16px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Instruction Logic
            </h2>
            <Input.TextArea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={8}
                placeholder="Describe automation logic. e.g. Start motor X0, Stop X1..."
                className="engineering-grid"
                style={{
                    flexGrow: 1,
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)',
                    borderColor: 'var(--border-color)',
                    fontFamily: 'var(--font-mono)',
                    resize: 'none'
                }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={generateMutation.isPending}
                    onClick={handleGenerate}
                    style={{ flex: 1, backgroundColor: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', color: 'var(--background)', fontWeight: 600 }}
                >
                    Generate Logic
                </Button>
                <Button
                    icon={<DeleteOutlined />}
                    onClick={resetAll}
                    style={{ backgroundColor: 'var(--border-color)', color: '#ef4444', borderColor: 'transparent' }}
                >
                    Clear
                </Button>
            </div>
        </div>
    );
}
