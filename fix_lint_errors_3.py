import re

def fix_app_tsx():
    with open('components/App.tsx', 'r') as f:
        content = f.read()

    # Remove screenToWorld definition
    # const screenToWorld = useCallback((x: number, y: number) => rawScreenToWorld(x, y, dimensions), [rawScreenToWorld, dimensions]);
    # It spans multiple lines potentially? No, probably one line in my view, but check.
    # It uses rawScreenToWorld from useWorldScale.

    # I'll match the start of the line.
    content = re.sub(r'^\s*const screenToWorld = useCallback.*$', '', content, flags=re.MULTILINE)

    # Also remove it from Simulation usage if not done (it was done)

    with open('components/App.tsx', 'w') as f:
        f.write(content)

def fix_radial_menu():
    with open('components/RadialMenu.tsx', 'r') as f:
        content = f.read()

    pattern = r'action: \(dispatch: React\.Dispatch<GameAction>, node: GameNode, onAsk: \(nodeId: string\) => void\)'
    replacement = 'action: (node: GameNode, onAsk: (nodeId: string) => void)'
    content = re.sub(pattern, replacement, content)

    with open('components/RadialMenu.tsx', 'w') as f:
        f.write(content)

def fix_gemini_service():
    with open('services/geminiService.ts', 'r') as f:
        content = f.read()

    # Fix the double fallback I likely introduced
    content = content.replace("apiKey: process.env.API_KEY || '' || '' as string", "apiKey: (process.env.API_KEY || '')")
    content = content.replace("apiKey: process.env.API_KEY || ''", "apiKey: (process.env.API_KEY || '')")

    with open('services/geminiService.ts', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app_tsx()
    fix_radial_menu()
    fix_gemini_service()
