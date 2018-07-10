import subprocess, sys

commits = int(subprocess.check_output(['git', 'rev-list', 'HEAD', '--count']))
# print commits

version = '-DFIRMWARE_VERSION=\'"'
version += str(int(commits / 1000))
version += '.'
version += str(int((commits / 10) % 100))
version += '.'
version += str(int(commits % 10))
version += '"\''
sys.stdout.write(version)
sys.stdout.flush()
