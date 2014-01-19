// some key constants
KEY = {
  SPACE: 32,
  UP: 37,
  DOWN: 38,
  LEFT: 39,
  RIGHT: 40,
  A: 65,
  S: 83,
  D: 68,
  W: 87
}

// some color constants
COLOR = {
  BLACK: '#000000',
  DARK: '#111111',
  WHITE: '#ffffff',
  GREEN: '#00ff00',
  ORANGE: '#ffa500',
  RED: '#ff0000'
}

function rand(num) {
  return Math.floor(Math.random() * num)
}

function assert(test, message) {
  if (test) {
    // fine
  } else {
    throw message
  }
}

Framework = {}

Framework.Game = function (w, h, id, states) {
  this.width = w
  this.height = h
  this.id = id
  this.states = states
  this.backgroundColor = 'rgb(255, 255, 255)'
}

// constructor
function Sprite(x, y, strokeStyle, fillStyle) {
  // console.log('new sprite stroke is ' + strokeStyle + ' fill is ' + fillStyle)
  if (!(this instanceof Sprite)) {
    return new Sprite(x, y, strokeStyle, fillStyle)
  }
  this.x = x
  this.y = y
  this.strokeStyle = strokeStyle
  this.fillStyle = fillStyle
  this.width = 50
  this.height = 50
  this.collideWorldBounds = false
  this.exists = true
  this.anchor = [0, 0] // top left
  this.outOfBoundsKill = false
  this.angle = 0
}

Sprite.prototype.set_anchor = function (x, y) {
  assert(x >= 0)
  assert(x <= 1)
  assert(y >= 0)
  assert(y <= 1)
  this.anchor = [x, y]
}

Sprite.prototype.reset = function (x, y) {
  this.x = x
  this.y = y
  this.exists = true
  this.angle = 0
}

Sprite.prototype.set_size = function (width, height) {
  this.width = width
  this.height = height
}

Sprite.prototype.kill = function () {
  this.exists = false
}

Sprite.prototype.physics = function () {
  if (!this.exists) {
    return
  }
  if (this.gravity_x) {
    this.velocity_x += this.gravity_x
  }
  if (this.velocity_x) {
    this.x += this.velocity_x * 0.01
  }
  if (this.gravity_y) {
    this.velocity_y += this.gravity_y
  }
  if (this.velocity_y) {
    this.y += this.velocity_y * 0.01
  }
  if (this.outOfBoundsKill && 
    (this.x+this.width < 0 ||
	   this.x > game.width+this.width ||
	   this.y+this.height < 0 ||
	   this.y > game.height+this.height))
  {
    this.exists = false
  }
}

Sprite.prototype.draw = function (c) {
  // console.log('draw sprite stroke is ' + this.strokeStyle + ' fill is ' + this.fillStyle)
  if (!this.exists) {
    return
  }
  c.save()
  c.translate(this.x, this.y)
  c.rotate( -1 * this.angle * Math.PI / 180)
  c.translate(-1 * this.anchor[0] * this.width, -1 * this.anchor[1] * this.height)
  c.fillStyle = this.fillStyle
  c.fillRect(0, 0, this.width, this.height)
  c.strokeStyle = this.strokeStyle
  c.strokeRect(0, 0, this.width, this.height)
  c.restore()
}

Framework.Game.prototype.add_sprite = function (x, y, strokeStyle, fillStyle) {
  // console.log('add_sprite stroke is ' + strokeStyle + ' fill is ' + fillStyle)
  var new_sprite = new Sprite(x, y, strokeStyle, fillStyle)
  this.states[this.current].things.push(new_sprite)
  return new_sprite
}

// constructor
function Group(count, strokeStyle, fillStyle) {
  if (!(this instanceof Group)) {
    return new Group(count)
  }
  this.representation = []
  for (var i = 0; i < count; i += 1) {
    var elem = new Sprite(0, 0, strokeStyle, fillStyle)
    elem.exists = false
    this.representation.push(elem)
  }
}

Group.prototype.set_all = function (property, value) {
  for (var i = 0; i < this.representation.length; i += 1) {
    this.representation[i][property] = value
  }
}

Group.prototype.for_each_alive = function (callback) {
  for (var i = 0; i < this.representation.length; i += 1) {
    callback(this.representation[i])
  }
}

// returns the first of the existent (true) or non-existent (false) elements of this group
Group.prototype.get_first_exists = function (requested_existence) {
  for (var i = 0; i < this.representation.length; i += 1) {
    if (this.representation[i].exists == requested_existence) {
      return this.representation[i]
    }
  }
  return null
}

Group.prototype.physics = function (now) {
  for (var i = 0; i < this.representation.length; i += 1) {
    this.representation[i].physics(now)
  }
}

Group.prototype.draw = function (context) {
  for (var i = 0; i < this.representation.length; i += 1) {
    this.representation[i].draw(context)
  }
}

Framework.Game.prototype.add_group = function (count, strokeStyle, fillStyle) {
  var new_group = new Group(count, strokeStyle, fillStyle)
  this.states[this.current].things.push(new_group)
  return new_group
}

// constructor
function Text(x, y, content, style) {
  if (!(this instanceof Text)) {
    return new Text(x, y, content, style)
  }
  this.x = x
  this.y = y
  this.content = content
  this.style = style
  this.alpha = 1
  this.anchor = [0, 0]
  this.lineheight = 15
}

Text.prototype.set_anchor = function (x, y) {
  assert(x >= 0)
  assert(x <= 1)
  assert(y >= 0)
  assert(y <= 1)
  this.anchor = [x, y]
}

Text.prototype.physics = function (now) {
  // do nothing
}

Text.prototype.draw = function (context) {
  context.fillStyle = 'rgba(0, 0, 0, ' + this.alpha + ')'
  var lines = this.content.toString().split('\n')
  for (var i = 0; i < lines.length; i++) {
    context.fillText(lines[i], this.x, this.y + (i*this.lineheight) )
  }
}

Framework.Game.prototype.add_text = function (x, y, content, style) {
  var new_text = new Text(x, y, content, style)
  this.states[this.current].things.push(new_text)
  return new_text
}

Framework.Game.prototype.start = function (first) {
  var self = this
  this.canvas = document.getElementById(this.id)
  this.context = this.canvas.getContext('2d')
  this.current = first
  this.states[this.current].things = []
  this.states[this.current].create()
  if (self.update) {
    requestAnimationFrame(function () {
      self.update()
    })
  }
}

Framework.Game.prototype.update = function () {
  var self = this
  if (this.states[this.current].update) {
    this.states[this.current].update()
  }
  var now = this.now()
  for (var i = 0; i < this.states[this.current].things.length; i += 1) {
    this.states[this.current].things[i].physics(now)
  }
  this.context.fillStyle = this.backgroundColor
  this.context.fillRect(0, 0, this.width, this.height)
  for (var i = 0; i < this.states[this.current].things.length; i += 1) {
    this.states[this.current].things[i].draw(this.context)
  }
  requestAnimationFrame(function () {
    self.update()
  })
}


// constructor
function Keys() {
  if (!(this instanceof Keys)) {
    return new Keys()
  }
  var self = this
  window.onkeydown = function (e) { self[e.keyCode] = true }
  window.onkeyup = function (e) { self[e.keyCode] = false }
}

Keys.prototype.is_down = function (which) {
  return this[which]
}

Framework.Game.prototype.create_keys = function () {
  return new Keys()
}

Framework.Game.prototype.now = function () {
  return window.performance.now()
}

Framework.Game.prototype.overlap_one_many = function (a, group, callback_method, obj_to_callback) {
  if (a.exists) {
    for (var i = 0; i < group.representation.length; i += 1) {
      var b = group.representation[i]
	  if (b.exists &&
	    (Math.abs(a.x - b.x) * 2 < (a.width + b.width)) && // TODO: factor this out so we can test aabbs one to one
        (Math.abs(a.y - b.y) * 2 < (a.width + b.width)))
	  {
	    return callback_method.call(obj_to_callback, a, b)
      }
    }
  }
}

Framework.Game.prototype.overlap_many_many = function (group_a, group_b, callback_method, obj_to_callback) {
  for (var i = 0; i < group_a.representation.length; i += 1) {
    var a = group_a.representation[i]
	this.overlap_one_many(a, group_b, callback_method, obj_to_callback)
  }
}

Framework.Game.prototype.overlap = function (x, y, callback_method, obj_to_callback) {
  if (x instanceof Group && y instanceof Group) {
    this.overlap_many_many(x, y, callback_method, obj_to_callback)
  } else {
    this.overlap_one_many(x, y, callback_method, obj_to_callback)
  }
}

Framework.Game.prototype.switch_to = function (statename) {
  this.current = statename
  this.states[this.current].things = []
  this.states[this.current].create()
}

// constructor
function Tween(element, ultimate_properties, initial_time, final_time) {
  if (!(this instanceof Tween)) {
    return new Tween(element, ultimate_properties, initial_time, final_time)
  }
  this.element = element
  this.ultimate_properties = ultimate_properties
  this.initial_properties = {}
  for (var property in this.ultimate_properties) {
    this.initial_properties[property] = element[property]
  }
  this.initial_time = initial_time
  this.final_time = final_time
}

Tween.prototype.physics = function (now) {
  if (now < this.final_time) {
    var dur = this.final_time - this.initial_time
    var f = (now - this.initial_time) / dur
    for (var p in this.ultimate_properties) {
      var new_value = this.ultimate_properties[p] * f + this.initial_properties[p] * (1 - f)
      this.element[p] = new_value
    }
  } else {
    for (var p in this.ultimate_properties) {
      this.element[p] = this.ultimate_properties[p]
    }
    this.exists = false
  }
}

Tween.prototype.draw = function (context) {
  // do nothing
}

Framework.Game.prototype.add_tween = function (element, properties, duration) {
  var new_tween = new Tween(element, properties, this.now(), duration + this.now())
  this.states[this.current].things.push(new_tween)
}

// constructor
function Emitter() { // TODO?
  if (!(this instanceof Emitter)) {
    return new Emitter() // TODO?
  }
  // TODO?
}

Emitter.prototype.make_particles = function () { // TODO?
  // TODO?
}

Emitter.prototype.start = function () { // TODO?
  // TODO?
}

Framework.Game.prototype.add_emitter = function () { // TODO?
  return new Emitter() // TODO?
}
