/**
	*gridhelper.js
	*jQuery 栅格化辅助插件
	*jQuery 1.7+
	*@author aronhuang
	*@version 1.0
	*@example : $('#demo').gridhelper();
*/


;(function($) {
	$.fn.gridhelper = function(options) {
		if(this.length == 0) {
			return this;
		}
		var returnValue, args = arguments;
		this.each(function() {
			var instance = $(this).data('_gridhelper');
			//如果第一个参数是String，则调用相应方法,其他参数作为方法的参数，但必须先生成实例
			if(typeof(options) == 'string'){
				//实例已生成
				if (instance) {
					var methodName = options;
					if(typeof(instance[methodName]) === 'function'){
						args = Array.prototype.slice.call(args, 1 );
						returnValue = instance[methodName].apply(instance, args);
						console.log(returnValue);
					}
				}
			}
			//如果参数是配置对象，则生成实例
			else {
				//实例未生成
				if(!instance){
					instance = new $.Gridhelper($(this),options);
					$(this).data('_gridhelper', instance);
				}
				//实例已生成，根据新配置重新初始化 
				else {
					instance._reInit(options);
				}
			}
		});
		//有返回值则返回返回值，无返回值返回调用的jQuery对象，保持jQuery链式调用
		return returnValue === undefined ? this : returnValue;
	};

	$.fn.getGridhelperInstance = function(){
		return this.eq(0).data('_gridhelper');
	};


	/**
		CLASS : Gridhelper
	*/
	$.Gridhelper = function(object, options) {
		this.object = object;
		this.options = $.extend(true, {}, $.Gridhelper.defaults, options);
		this._init();
	};


	$.Gridhelper.prototype = {

		constructor: $.Gridhelper,

		/*初始化*/
		_init: function(){
			if (this.object[0].tagName.toLowerCase != 'body') {
				this.object.css('position', 'relative');
			}
			this.createGrid();
			this._bindEvent();
		},


		/*重设*/
		_reInit: function(options){
			this.options = $.extend(true, {}, $.Gridhelper.defaults, options);
			this.createGrid();
		},

		/*生成柵格*/
		createGrid: function(options){
			if (options) {
				this.options = $.extend(true, {}, $.Gridhelper.defaults, options);
			}
			var options = this.options;
			var obj = this.object;
			var gridW, gridH, gridNum, gutterW, cellW, unitW, restW,gridLeft;
			gridW = parseInt(options.gridWidth, 10);
			if (isNaN(gridW) || gridW > obj.width()) {
				gridW = obj.width();
			}
			gridH = parseInt(options.gridHeight, 10);
			if (isNaN(gridH) || gridH > obj.height()) {
				gridH = obj.height();
			}
			gridLeft = (obj.width() - gridW)/2
			gutterW =  parseInt(options.gutterWidth, 10);
			unitW = parseInt(options.cellWidth, 10) + gutterW;
			gridNum = parseInt(gridW/unitW, 10);
			restW = parseInt(gridW%unitW, 10);
			if (restW != 0) {
				gridNum ++;
			}

			if (!this.wrapper) {
				this.wrapper = $('<div data-role="gridhelper" />').appendTo(this.object);
			} else {
				this.wrapper.empty();
			}
			this.wrapper.css({
				position: 'absolute',
				top: 0,
				left: gridLeft,
				zIndex: options.zIndex,
				width: gridW,
				height: gridH,
				opacity: options.opacity
			}).show();

			var gridShell =  $('<div />');
			for (var i = 1; i <= gridNum; i++) {
				$('<span />').css({
					float: 'left',
					width: i == gridNum && restW != 0 ? restW : options.cellWidth,
					height: '100%',
					marginRight: i == gridNum ? 0 : gutterW,
					background: options.cellBgColor 
				}).appendTo(gridShell);
			}
			this.wrapper.append(gridShell.children());
		},


		/*绑定事件*/
		//鼠标事件顺序 down > up > click 
		_bindEvent: function(){
			var self = this, options = self.options;

			//为保存拖拽和箭头产生的位移，拖拽和箭头改变的属性为margin 
			//快捷键移动功能
			var keys = {left: 37, up: 38, right: 39, down: 40};
			//点击柵格层激活移动
			this.wrapper.on('click', function(e){
				if (!options.movable || self.moveActive) {return ;}
				self.moveActive = true;
				self.wrapper.addClass('gs_move_active');
			});
			//点击柵格外失去移动功能
			$(document).on('click', function(e){
				if (!self.moveActive) {return ;};
				var target  = e.target || e.srcElement;
				if($(target).closest(self.wrapper).length == 0){
					self.moveActive = false;
					self.wrapper.removeClass('gs_move_active');
				}
			});
			//快捷键移动柵格
			$('body').on('keydown', function(e){
				if (self.moveActive && $.inArray(e.keyCode,[37,38,39,40]) != -1) {
					e.preventDefault();
					var step = e.shiftKey ? 10 : 1;
					var marginProperty = 'margin-top';
					switch (e.keyCode){
					case keys.up:
						step = -step;
						break ;
					case keys.down: 
						break ;
					case keys.left:
						marginProperty = 'margin-left';
						step = -step;
						break ;
					case keys.right: 
						marginProperty = 'margin-left';
						break ;
					}
					self.wrapper.css(marginProperty, (parseInt(self.wrapper.css(marginProperty),10) + step));
				}
			});

			//鼠标拖拽功能
			var pageX, pageY;
			this.wrapper.on('mousedown', function(e){
				if (!options.draggable) {return ;}
				self.dragActive = true;
				pageX = e.pageX;
				pageY = e.pageY;
			});
			$(document).on('mousemove',function(e){
				if(!self.dragActive){ return ;}
				self.wrapper.css({
					marginLeft: parseInt(self.wrapper.css('margin-left'), 10) + e.pageX - pageX,
					marginTop: parseInt(self.wrapper.css('margin-top'), 10) + e.pageY - pageY
				}).addClass('gs_drag_active');;
				pageX = e.pageX;
				pageY = e.pageY;

			}).on('mouseup',function(e){
				if(!self.dragActive){ return ;}
				self.dragActive = false;
				self.wrapper.removeClass('gs_drag_active');
			});
		},


		/*生成单元格*/
		_createCell: function(options){
			for (var i = 1; i <= gridNum; i++) {
				$('<span />').css({
					float: 'left',
					width: i == gridNum && leftW != 0 ? leftW : options.cellWidth,
					height: '100%',
					marginRight: i == gridNum ? 0 : gutterWidth,
					background: options.cellBgColor 
				}).appendTo(this.gridObj);
			}
		},

		/*隐藏栅格层*/
		hide: function(){
			this.wrapper.hide();
		},

		/*显示栅格层*/
		show: function(){
			this.wrapper.show();
		},

		/*摧毁实例*/
		destroy: function(){
			this.object.removeData('_gridhelper');
			this.wrapper.remove();
		},

		/**/
		setColor: function(colorString){
			this.wrapper.find('> span').css({
				background: colorString
			});
		}


	};


	/**
		*Gridhelper默认参数
	*/
	$.Gridhelper.defaults = {
		gridWidth: undefined,//生成的栅格宽，如果无,则取容器宽
		gridHeight: undefined,//生成的栅格高，如果无,则取容器宽
		cellWidth: 40,
		cellBgColor: '#FF8A00',
		gutterWidth: 10,
		opacity: 0.4,
		zIndex: 1001,
		movable: true,
		draggable: true
	};

})(jQuery)