#!/bin/env python
import subprocess, sys

sys.stdout.write('-Wl,-Teagle.flash.1m0.ld ')
sys.stdout.write('-DPIO_FRAMEWORK_ARDUINO_LWIP2_LOW_MEMORY ')
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
