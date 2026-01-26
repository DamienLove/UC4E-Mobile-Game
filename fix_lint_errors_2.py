import re

def fix_app_tsx():
    with open('components/App.tsx', 'r') as f:
        content = f.read()

    # Comment out unused constants starting with _
    content = re.sub(r'^(const _[A-Z_]+ =)', r'// \1', content, flags=re.MULTILINE)

    # Remove screenToWorld prop from Simulation component
    content = content.replace('screenToWorld={screenToWorld}', '')

    with open('components/App.tsx', 'w') as f:
        f.write(content)

def fix_radial_menu_tsx():
    with open('components/RadialMenu.tsx', 'r') as f:
        content = f.read()

    content = re.sub(r'dispatch,\s*', '', content)

    with open('components/RadialMenu.tsx', 'w') as f:
        f.write(content)

def fix_upgrade_card_tsx():
    with open('components/UpgradeCard.tsx', 'r') as f:
        content = f.read()
    content = re.sub(r',\s*NodeType', '', content)
    content = re.sub(r'NodeType,\s*', '', content)

    with open('components/UpgradeCard.tsx', 'w') as f:
        f.write(content)

def revert_and_fix_constants_ts():
    with open('components/constants.ts', 'r') as f:
        content = f.read()

    # Revert global replace
    content = content.replace('(_gs)', '(gs)')

    # Fix specific unused var
    content = content.replace('unlockCondition: (gs: GameState) => true', 'unlockCondition: () => true')

    with open('components/constants.ts', 'w') as f:
        f.write(content)

def fix_gemini_service_ts():
    with open('services/geminiService.ts', 'r') as f:
        content = f.read()

    # Fix type error: apiKey: process.env.API_KEY || ''
    content = re.sub(r'apiKey:\s*process\.env\.API_KEY', 'apiKey: process.env.API_KEY || \'\'', content)

    with open('services/geminiService.ts', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app_tsx()
    fix_radial_menu_tsx()
    fix_upgrade_card_tsx()
    revert_and_fix_constants_ts()
    fix_gemini_service_ts()
