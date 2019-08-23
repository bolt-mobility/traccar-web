#!/bin/sh
  
cd $(dirname $0)/../web

# Use the value of $EXTJS_PATH if it is defined, '../../../ext-6.2.0' otherwise
EXT=${EXTJS_PATH:-'../ext-6.2.0'}
SENCHA_PATH=${HOME}/bin/Sencha/Cmd/6.7.0.37

${SENCHA_PATH}/sencha compile --classpath=app.js,app,$EXT/packages/core/src,$EXT/packages/core/overrides,$EXT/classic/classic/src,$EXT/classic/classic/overrides \
       exclude -all \
       and \
       include -recursive -file app.js \
       and \
       exclude -namespace=Ext \
       and \
       concatenate -closure app.min.js