/**
 * Created by pavelzotov on 03.02.16.
 */
(function(app) {
	var gmtZones = {
		"+0": "Гринвич, Лондон, Рейкьявик, Лиссабон, Дакар",
		"+1": "Рим, Париж, Берлин, Осло, Мадрид, Копенгаген, Вена",
		"+2": "Киев, Минск, Анкара, Афины, Иерусалим, Хельсинки, София, Бухарест, Кейптаун",
		"+3": "Москва, Аддис-Абеба, Багдад",
		"+4": "Тегеран, Баку, Абу-Даби",
		"+5": "Душанбе, Ташкент, Карачи",
		"+6": "Алматы, Тюмень",
		"+7": "Новосибирск, Джакарта, Бангкок",
		"+8": "Иркутск, Пекин, Шанхай",
		"+9": "Токио, Сеул, Пхеньян",
		"+10": "Канберра, Сидней, Мельбурн",
		"+11": "Магадан",
		"+12": "Веллингтон",
		"-12": "Анадырь, Камчатка",
		"-11": "Ном (Аляска), Самоа",
		"-10": "Аляска, Гавайи",
		"-8": "Лос-Анджелес, Сан-Франциско, Сиэтл, Ванкувер",
		"-7": "Денвер, Феникс, о.Пасхи",
		"-5": "Нью-Йорк, Вашингтон, Атланта, Оттава, Гавана, Богота, Лима",
		"-4": "Ла-Пас, Каракас, Галифакс",
		"-3": "Асунсьон, Буэнос-Айрес",
		"-2": "Сан-Паулу, Бразилиа",
		"-1": "Азорские о-ва"
	},
		gmtList = [];
	for(var i in gmtZones){
		var cities = gmtZones[i].split( /, /g);
		for(var j in cities){
			gmtList.push({
				offset: i,
				name: cities[j]
			});
		}
	}

	var updateTimer = null,
		updateTime = function(){
			var gmt = new Date(),
				h = gmt.getUTCHours(),
				m = gmt.getUTCMinutes(),
				s = gmt.getUTCSeconds(),
				rows = viewState.get('rows');
			if(s<10) s = '0' + s;
			if(m<10) m = '0' + m;

			rows.forEach(function(row){
				var h1 = (h + ~~row.offset)%24;
				$("#timetd-" + row.id).html(h1 + ':' + m + ':' + s);
			});
		},
		Model = Backbone.Model.extend({
			defaults: {
				state: 'list',
				rows: [],
				index: 0,
				zones: gmtList,
				row: {
					id: 0,
					name: '',
					offset: 0
				}
			}
		}),
		viewState = new Model(),
		Router = Backbone.Router.extend({
			routes: {
				'': 'list',
				'!/': 'list',
				'!/edit/:id': 'edit',
				'!/delete/:id': 'delete',
				'!/add': 'add'
			},
			list: function () {
				viewState.set({state: 'list'});
			},
			edit: function (id) {
				var rows = viewState.get('rows');
				for(var i=0; i<rows.length; i++){
					if(rows[i].id==id){
						viewState.set({
							state: 'form',
							row: rows[i]
						});
						return;
					}
				}
				viewState.set({state: 'list'});
			},
			add: function () {
				viewState.set({
					state: 'form',
					row: {
						id: 0,
						name: '',
						offset: ''
					}
				});
			},
			delete: function (id){
				var rows = viewState.get('rows');
				for(var i=0; i<rows.length; i++){
					if(rows[i].id==id){
						rows.splice(i,1);
						break;
					}
				}
				viewState.set({rows: rows});
				viewState.trigger('change');
				controller.navigate('!/');
			}
		}),
		controller = new Router(),
		View = Backbone.View.extend({
			events: {
				'submit #form1': function (e){
					e.preventDefault();

					var data = Backbone.Syphon.serialize(this),
						rows = this.model.get('rows'),
						index = this.model.get('index');

					if(data.row.id==0){
						//добавляем строку
						index++;
						data.row.id = index;
						rows.push(data.row);
					} else {
						for(var i=0; i<rows.length; i++){
							if(rows[i].id==data.row.id){
								rows.splice(i,1,data.row);
								break;
							}
						}
					}
					this.model.set({
						state: 'list',
						index: index,
						rows: rows
					});
				},
				'reset #form1': function(){
					this.model.set({state: 'list'});
				},
				'click #gmt_use': function(){
					var gmt = $("#gmt_select");
					$('#field_offset').val(~~gmt.val());
					$('#field_name').val(gmt.find("option:selected").text().replace(' (GMT'+gmt.val()+')', ''));
				}
			},
			initialize: function () {
				this.listenTo(this.model, 'change', this.render);
				this.model.listenTo(this.model, "change:state", function () {
					if(this.get("state")=='list')
						controller.navigate("!/", false);
				});
			},
			templates: {
				list: _.template($('#block_list').html()),
				form: _.template($('#block_form').html())
			},
			render: function () {
				localforage.setItem('savedModel', JSON.stringify(this.model.toJSON()));

				var state = this.model.get('state');
				$(this.el).html(this.templates[state](this.model.toJSON()));
				if(state=='list') {
					updateTime();
					updateTimer = setInterval(updateTime, 1000);
				} else clearInterval(updateTimer);
				return this;
			}
		}),
		view = new View({model: viewState, el: app})
		;
	Backbone.history.start();

	localforage.getItem('savedModel', function(err, value){
		if(!err){
			if(value = JSON.parse(value)){
				value.state = 'list';
				viewState.set(value);
			}
		}
		viewState.trigger('change');
	});
	//viewState.trigger('change');
})($('#app'));
