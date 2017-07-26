#!/bin/bash
function rest_mosml {
  timeout 3 mosml
  echo $?
}

rest_mosml | tail -n +3
