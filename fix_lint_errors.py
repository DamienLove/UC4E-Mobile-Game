import re

def fix_app_tsx():
    with open('components/App.tsx', 'r') as f:
        content = f.read()

    # Remove unused imports (already partially done, but cleaning up)
    # The previous patch might have worked, but let's be sure about 'transform'
    content = re.sub(r'const \{ width, height, transform: _transform \} = action.payload;', 'const { width, height } = action.payload;', content)
    content = re.sub(r'const \{ width, height, transform \} = action.payload;', 'const { width, height } = action.payload;', content)

    # Ensure nodesToRemove is commented out (it was in my patch, but double check)
    # It was patched to // const nodesToRemove... so it should be fine.

    with open('components/App.tsx', 'w') as f:
        f.write(content)

def fix_simulation_tsx():
    with open('components/Simulation.tsx', 'r') as f:
        content = f.read()

    # Remove unused imports
    content = content.replace('import React, { useRef } from \'react\';', 'import React from \'react\';')

    # Remove unused props
    content = content.replace('screenToWorld, ', '')
    content = content.replace('screenToWorld: (screenX: number, screenY: number) => { x: number; y: number };', '')

    # Fix e unused in handlePlayerInteraction
    content = content.replace('const handlePlayerInteraction = (e: React.MouseEvent) => {', 'const handlePlayerInteraction = (_e: React.MouseEvent) => {')

    # Fix undefined types
    # event.radius -> (event.radius || 0)
    # We use regex to be careful not to double replace
    content = re.sub(r'event\.radius(?! \|\|)', '(event.radius || 0)', content)

    # black holes loop
    content = re.sub(r'bh\.x(?! \|\|)', '(bh.x || 0)', content)
    content = re.sub(r'bh\.y(?! \|\|)', '(bh.y || 0)', content)
    content = re.sub(r'bh\.radius(?! \|\|)', '(bh.radius || 0)', content)

    with open('components/Simulation.tsx', 'w') as f:
        f.write(content)

def fix_level_transition_tsx():
    with open('components/LevelTransition.tsx', 'r') as f:
        content = f.read()
    content = content.replace('zoomLevel, ', '') # unused prop
    with open('components/LevelTransition.tsx', 'w') as f:
        f.write(content)

def fix_radial_menu_tsx():
    with open('components/RadialMenu.tsx', 'r') as f:
        content = f.read()
    # dispatch is unused in the component destructuring?
    # components/RadialMenu.tsx(15,17): error TS6133: 'dispatch' is declared but its value is never read.
    content = content.replace('dispatch, ', '')
    with open('components/RadialMenu.tsx', 'w') as f:
        f.write(content)

def fix_upgrade_card_tsx():
    with open('components/UpgradeCard.tsx', 'r') as f:
        content = f.read()
    content = content.replace('import { GameState, Upgrade, NodeType }', 'import { GameState, Upgrade }')
    with open('components/UpgradeCard.tsx', 'w') as f:
        f.write(content)

def fix_constants_ts():
    with open('components/constants.ts', 'r') as f:
        content = f.read()
    # gs unused in some arrow functions?
    # components/constants.ts(217,25): error TS6133: 'gs' is declared but its value is never read.
    content = re.sub(r'\((gs)\) =>', '(_gs) =>', content)
    with open('components/constants.ts', 'w') as f:
        f.write(content)

def fix_gemini_service_ts():
    with open('services/geminiService.ts', 'r') as f:
        content = f.read()
    # services/geminiService.ts(102,23): error TS2322: Type 'string | undefined' is not assignable to type 'string'.
    # services/geminiService.ts(102,50): error TS2532: Object is possibly 'undefined'.
    # It likely involves accessing process.env.API_KEY or similar.
    # Let's verify the line.
    # We will assume we can cast it or fallback.
    # "apiKey: process.env.API_KEY" -> "apiKey: process.env.API_KEY || ''"
    content = content.replace('apiKey: process.env.API_KEY', 'apiKey: process.env.API_KEY || \'\'')

    with open('services/geminiService.ts', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app_tsx()
    fix_simulation_tsx()
    fix_level_transition_tsx()
    fix_radial_menu_tsx()
    fix_upgrade_card_tsx()
    fix_constants_ts()
    fix_gemini_service_ts()
