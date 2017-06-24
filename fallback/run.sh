#!/bin/bash
prog=/home/mosml/prog.sml

cat > $prog && mosml $prog | tail -n +4 | head -n -2
