import re
with open('components/SidebarSanad.tsx', 'r') as f:
    content = f.read()

target1 = """              <img
                src={state.profile.avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#DDD7CB]"
              />"""

replacement1 = """              <Image
                src={state.profile.avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#DDD7CB]"
                width={40}
                height={40}
              />"""
              
target2 = """              <img
                src={state.profile.avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
              />"""

replacement2 = """              <Image
                src={state.profile.avatarUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                width={40}
                height={40}
              />"""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open('components/SidebarSanad.tsx', 'w') as f:
    f.write(content)
