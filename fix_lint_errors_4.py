import re

def fix_app_tsx():
    with open('components/App.tsx', 'r') as f:
        content = f.read()

    content = content.replace('screenToWorld: rawScreenToWorld,', '')

    with open('components/App.tsx', 'w') as f:
        f.write(content)

def fix_gemini_service():
    with open('services/geminiService.ts', 'r') as f:
        content = f.read()

    content = content.replace('const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;', 'const base64ImageBytes: string = response.generatedImages[0].image?.imageBytes || \'\';')

    with open('services/geminiService.ts', 'w') as f:
        f.write(content)

if __name__ == '__main__':
    fix_app_tsx()
    fix_gemini_service()
