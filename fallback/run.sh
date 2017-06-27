#!/bin/bash
prog=/home/mosml/prog.sml

timeout 5 cat > $prog && mosml $prog | tail -n +4 | head -n -2
