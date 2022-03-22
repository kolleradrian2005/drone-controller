cmd_Release/driver.node := ln -f "Release/obj.target/driver.node" "Release/driver.node" 2>/dev/null || (rm -rf "Release/driver.node" && cp -af "Release/obj.target/driver.node" "Release/driver.node")
