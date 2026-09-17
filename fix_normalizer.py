with open('lib/name-normalizer.ts', 'r') as f:
    content = f.read()

# 1. Change officialStream default
content = content.replace("let officialStream = 'عام';", "let officialStream = 'غير مصنف';")

# 2. Update LITERATURE regex
content = content.replace(
    "/اداب\\s*و\\s*فلسفه|آداب\\s*وفلسفة|فلسفه|فلسفة|آف|اف|أف|آ\\.ف|أ\\.ف/i",
    "/اداب|آداب|فلسفه|فلسفة|آف|اف|أف|آ\\.ف|أ\\.ف/i"
)

# 3. Update SCIENCES regex
content = content.replace(
    "/علوم\\s*تجريبيه|علوم\\s*تجريبية|تجريبيه|تجريبية|ع\\s*ت|ع\\.ت|عت/i",
    "/علوم|تجريبيه|تجريبية|ع\\s*ت|ع\\.ت|عت/i"
)

# 4. Update canonicalName and canonicalKey generation
old_switch = """      default:
        canonicalName = `${levelNumber} ${officialStream} ${groupNumber}`;
        break;
    }
  }

  const canonicalKey = `${levelNumber}_${streamKey}_${groupNumber}`;"""

new_switch = """      case 'UNKNOWN':
        canonicalName = text.trim();
        break;
      default:
        canonicalName = `${levelNumber} ${officialStream} ${groupNumber}`;
        break;
    }
  }

  const canonicalKey = streamKey === 'UNKNOWN' ? text.trim().replace(/\\s+/g, '_') : `${levelNumber}_${streamKey}_${groupNumber}`;"""

content = content.replace(old_switch, new_switch)

with open('lib/name-normalizer.ts', 'w') as f:
    f.write(content)

