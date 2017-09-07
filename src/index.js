/**
 * @file This plugin transforms ES2015 modules to KISSY
 * 
 * @author Leo Wang(leowang721@gmail.com)
 */

import {basename, extname} from 'path'
import template from 'babel-template'
import transformCommonjs from 'babel-plugin-transform-es2015-modules-commonjs'

const buildDefine = template(`
  KISSY.add(MODULE_NAME, FACTORY, {requires: [SOURCES], cssRequires: [CSS_SOURCES]});
`)

const buildFactory = template(`
  (function (S, SOURCE_NAMES) {
    var exports = {}
    BODY;
    return exports.default;
  })
`)

export default function ({types: t}) {
  function isValidRequireCall (path) {
    if (!path.isCallExpression()) {
      return false
    }
    if (!path.get('callee').isIdentifier({ name: 'require' })) {
      return false
    }
    if (path.scope.getBinding('require')) {
      return false
    }

    const args = path.get('arguments')
    if (args.length !== 1) {
      return false
    }

    const arg = args[0]
    if (!arg.isStringLiteral()) {
      return false
    }

    return true
  }

  function getSourcesAndNames (sourcesFound) {
    const sources = []
    const usedSources = []
    const sourceNames = []
    const cssSources = []

    let hasSeenNonBareRequire = false
    for (let i = sourcesFound.length - 1; i > -1; i--) {
      const source = sourcesFound[i]

      if (/^css!/.test(source[1].value)) {
        cssSources.unshift(Object.assign({}, source[1], {value: source[1].value.replace(/^css!/, '')}))
      } else {
        sources.unshift(source[1])
        sourceNames.unshift(source[0])
        // bare import at end, no need for param
        if (!hasSeenNonBareRequire && source[2] === true) {
          continue
        }

        hasSeenNonBareRequire = true
        usedSources.unshift(source[1])
      }
    }

    return {sources, sourceNames, usedSources, cssSources}
  }

  const kissVisitor = {
    // kissy 理论上不会出现 exports 和 modules，所以先注掉
    // ReferencedIdentifier ({node, scope}) {
    //   if (node.name === 'exports' && !scope.getBinding('exports')) {
    //     this.hasExports = true
    //   }
    //   if (node.name === 'module' && !scope.getBinding('module')) {
    //     this.hasModule = true
    //   }
    // },
    CallExpression (path) {
      if (!isValidRequireCall(path)) {
        return
      }
      const source = path.node.arguments[0]
      const ref = path.scope.generateUidIdentifier(basename(source.value, extname(source.value)))
      this.sources.push([ref, source, true])
      path.remove()
    },
    VariableDeclarator (path) {
      const id = path.get('id')
      if (!id.isIdentifier()) {
        return
      }
      const init = path.get('init')
      if (!isValidRequireCall(init)) {
        return
      }
      const source = init.node.arguments[0]
      this.sourceNames[source.value] = true
      this.sources.push([id.node, source])

      path.remove()
    }
  }

  return {
    inherits: transformCommonjs,
    pre () {
      this.sources = []
      this.sourceNames = Object.create(null)
      this.hasExports = false
      this.hasModule = false
    },

    visitor: {
      Program: {
        exit (path) {
          if (this.ran) {
            return
          }
          this.ran = true
          path.traverse(kissVisitor, this)

          const {sources, sourceNames, cssSources} = getSourcesAndNames(this.sources)
          let moduleName = this.getModuleName()
          if (moduleName) {
            t.stringLiteral(moduleName)
          }

          const {node} = path
          const factory = buildFactory({
            SOURCE_NAMES: sourceNames,
            BODY: node.body
          })
          factory.expression.body.directives = node.directives
          node.directives = []

          node.body = [
            buildDefine({
              SOURCE_NAMES: sourceNames,
              SOURCES: sources,
              FACTORY: factory,
              CSS_SOURCES: cssSources
            })
          ]
        }
      }
    }
  }
}
