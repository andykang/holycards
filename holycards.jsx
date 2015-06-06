/**
 * Port of the leaderboard example to use React for rendering.
 *
 * This directive is necessary to enable preprocessing of JSX tags:
 * @jsx React.DOM
 */

var cx = React.addons.classSet,
    tantumErgo = 'Tantum ergo Sacramentum veneremur cernui et antiquum documentum novo cedat ritui præstet fides supplementum sensuum defectui.';

// Set up a collection to contain bulletin cards. On the server,
// it is backed by a MongoDB collection named "cards".
Cards = new Meteor.Collection("cards");

Meteor.methods({
  addCard: function(card) {
    return Cards.insert({
      headline: card.headline, 
      components: card.components,
      tags: card.tags
    });
  }
});


var StreamCreator = ReactMeteor.createClass({
  templateName: "StreamCreator",

  getMeteorState: function() {
    var userType = Session.get("user_type");
    if (!userType) {
      userType = "Admin";
      Session.set("user_type", userType);
    }
    return { userType: Session.get("user_type") };
  },

  toggleUserType: function() {
    var newType = this.state.userType === "Admin" ? "User" : "Admin";
    this.setState({userType: newType});
    Session.set("user_type", newType);
  },

  render: function() {
    var newCard = this.state.userType === "Admin" ? <NewCard /> : null;

    return  <div>
              <div class="control">
                <div class="user-select" onClick={this.toggleUserType}>
                  Switch to {this.state.userType === 'Admin' ? 'User' : 'Admin'} View
                </div>
              </div>
              <CardList />
              {newCard}
            </div>;
  }
});

var CardList = ReactMeteor.createClass({
  // Specifying a templateName property allows the component to be
  // interpolated into a Blaze template just like any other template:
  // {{> CardList x=1 y=2}}. This corresponds to the JSX expression
  // <CardList x={1} y={2} />.
  templateName: "CardList",

  startMeteorSubscriptions: function() {
    Meteor.subscribe("cards");
  },

  getMeteorState: function() {
    var selectedCard = Cards.findOne(Session.get("selected_card"));
    return {
      cards: Cards.find({}, {sort: {score: -1, name: 1}}).fetch(),
      selectedCard: selectedCard,
      selectedName: selectedCard && selectedCard.name
    };
  },

  addFivePoints: function() {
    Meteor.call("addPoints", Session.get("selected_card"), 5);
  },

  selectCard: function(id) {
    Session.set("selected_card", id);
  },

  renderCard: function(model) {
    var _id = this.state.selectedCard && this.state.selectedCard._id;

    // console.log(model._id);


    return <Card
      key={model._id}
      cardId={model._id}
      headline={model.headline}
      text={model.text}
      className={model._id === _id ? "selected" : ""}
      onClick={this.selectCard.bind(this, model._id)}
    />;
  },

  render: function() {
    var children = [
      <div className="cardlist">
        { this.state.cards.map(this.renderCard) }
      </div>
    ];

    return  <div className="inner">
              { children }
            </div>;
  }
});

var Card = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState){
    var { text, score, ...rest } = this.props;
    return text !== nextProps.text || score !== nextProps.score || rest.className !== nextProps.className;
  },
  renderCardComponent: function(component) {
    if (component.type === 'text') {
      return <div className='body-text'>{component.text}</div>;
    }
  },
  render: function() {
    var id = this.props.cardId;
    var card = Cards.findOne(id);
    // console.log(this.props);
    // console.log(card);
    if (card.compone)

    var props = this.props;
    var components = card.components ? card.components.map(this.renderCardComponent) : null;
    var headline = card.headline ? <span className="headline">{card.headline}</span> : null;
    var tags = card.tags ? <span className="tags">{card.tags.map(function(tag) { return '#' + tag; }).join(' ')}</span> : null;

    return <div {...props} className="card">
      { headline }
      { components }
      { tags }
    </div>;
  }
});

var NewCard = React.createClass({
  getInitialState: function () {
    var now = new Date().getTime();
    return {
      headline: '',
      components: [
        {
          type: 'text',
          text: ''
        }
      ],
      tags: [],
      address: '',
      startTime: null,
      endTime: null
    };
  },
  cancel: function() {
    this.setState(this.getInitialState());
    // console.log(this.getInitialState());
    // console.log("cancel!");
  },
  generateCard: function(event) {
    event.preventDefault();

    var id = Meteor.call("addCard", this.state);
    this.setState(this.getInitialState());
    console.log("generate card");
    console.log(this.state);

    // insert callback function to rerender cardlist.
  },
  updateCardComponent: function(index, type, event) {
    var value = event.target.value;

    var newComponents = this.state.components.slice(0);
    newComponents[index].text = value;
    this.setState({components: newComponents});
    // console.log('updateCardComponent', index);
  },
  renderCardComponent: function(card, index) {
    if (card.type === 'text') {
      return <textarea onChange={this.updateCardComponent.bind(this, index, 'text')} value={card.text} />;
    }
  },
  render: function() {
    var address = this.state.address,
        headline = this.state.headline;

    return  <div className="card new-card">
              <form onSubmit={this.generateCard} >
                <input className="headline" type="text" placeholder='Headline' value={headline} onChange={setField.bind(this, 'headline')} />
                { this.state.components.map(this.renderCardComponent) }

                <input type="text" value={address} placeholder="Add a place?" onChange={setField.bind(this, 'address')} />
                <EventCardForm end={false}/>
                <TagGenerator update={setField.bind(this, 'tags')} />
                <div>
                  <div onClick={this.cancel}>Cancel</div>
                  <button>Done</button>
                </div>
              </form>
            </div>;
  }
});

var AddNewComponent = React.createClass({
  getInitialState: function () {
    return {
      expand: false
    };
  },
  toggleExpand: function() {
    this.setState(!this.state.expand);
  },
  render: function() {
    return  <div className="add-new">
              <span className="add-new-button" onClick={this.toggleExpand}></span>
            </div>
  }
});

// var HeadlineCardForm = React.createClass({
//   getInitialState: function () {
//       return {
//           headline: ''
//       };
//   },
//   render: function() {
//     var headline = this.state.headline;
//     return <input className="headline" type="text" placeholder='Headline' value={headline} onChange={setField.bind(this, 'headline')} />
//   }
// });

var BodyTextCardForm = React.createClass({
  getInitialState: function() {
    return {
      text: this.props.value
    };
  },

  // handleKeyDown: function(event) {
  //   var key = event.which || event.keyCode;
  //   if (key === 13) {
  //     var id = Meteor.call("addCard", this.state.text);
  //     this.setState({text: ""});
  //     event.preventDefault();
  //   }
  // },

  render: function() {
    var text = this.state.text;
    return  <textarea class="new-card" onChange={setField.bind(this, 'text')} value={text} />
  }
});

var EventCardForm = React.createClass({
  getInitialState: function() {
    return {
      time: new Date().getTime(),
      end: this.props.end
    };
  },
  setDate: function(value) {

  },
  setTime: function(value) {

  },
  render: function() {
    var title = this.state.title,
        description = this.state.description;
    return  <div>
              <DateSelector initVal={this.state.startDate} update={this.setDate} />
              <TimeSelector initVal={this.state.startTime} update={this.setTime} />
            </div>;
  }
});

var TimeSelector = React.createClass({
  getInitialState: function() {
    return {
      time: this.props.initVal,
      text: this.props.initVal
    };
  },
  validateTime: function(event) {
    // validate time
    var value = event.target.value;
    if (value.match(/^[01]?\d:[0-5]\d [AP]M$/)) {
      this.setState({time: value});
      this.props.update(value);
    } else {
      this.setState({text: this.state.time});
    }
  },
  handleChange: function(event) {
    this.setState({text: event.target.value});
  },
  render: function() {
    var text = this.state.text;
    return <input className="time" type="text" placeholder="Add a time?" value={text} onChange={this.handleChange} onBlur={this.validateTime} />;
  }
});

var DateSelector = React.createClass({
  getInitialState: function() {
    return {
      date: this.props.initVal,
      text: this.props.initVal
    };
  },
  validateDate: function(event) {
    // validate time
    var value = event.target.value;
    if (value.match(/^((1[0-2])|\d)\/[0-3]?\d\/\d{4}$/)) {
      this.setState({date: value});
      this.props.update(event);
    } else {
      this.setState({text: this.state.date});
    }
  },
  handleChange: function(event) {
    this.setState({text: event.target.value});
  },
  render: function() {
    var text = this.state.text;
    return <input className="date" type="text" placeholder="Add a date?" value={text} onChange={this.handleChange} onBlur={this.validateDate} />;
  }
});

var TagGenerator = React.createClass({
  getInitialState: function () {
      return {
          tags: [],
          text: ''
      };
  },
  handleKeyDown: function(event) {
    var key = event.which || event.keyCode;
    if (key === 188) {
      event.preventDefault();
      // console.log('comma!');

      var newTag = this.state.text.split(' ').slice(-1),
          nextTags = this.state.tags.concat([newTag]),
          nextText = nextTags.map(function(str) { return '#' + str; }).join(' ') + ' ';
      this.setState({tags: nextTags, text: nextText});
    }
  },
  handleChange: function(event) {
    var value = event.target.value;
    this.setState({text: value});
    this.props.update(value);
  },
  render: function() {
    var text = this.state.text;
    return <input className="tags" type="text" placeholder="#tags" value={text} onKeyDown={this.handleKeyDown} onChange={this.handleChange} />
  }
});

// === Re-used Functions === //
function setField(prop, value) {
  var obj = {},
      trueValue = value.target ? value.target.value : value;

  obj[prop] = trueValue;
  // console.log(obj);
  this.setState(obj);
  if (this.props.update) {
    this.props.update(trueValue);
  }
}

function getDate(timestamp) {
  var month = timestamp.getMonth() + 1,
      day = timestamp.getDate(),
      year = timestamp.getFullYear();
  return [month, day, year].join('/');
}

function getTime(timestamp) {
  var hours = timestamp.getHours(),
      minutes = timestamp.getMinutes() < 10 ? '0' + timestamp.getMinutes() : timestamp.getMinutes(),
      isPm = timestamp.getHours() > 12;
  return (isPm ? hours - 12 : hours) + ':' + minutes + ' ' + (isPm ? 'PM' : 'AM');
}

// === Meteor === //

if (Meteor.isClient) {
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Cards.find().count() === 0) {
      var names = [];
      for (var i = 0; i < names.length; i++) {
        Cards.insert({
          name: names[i],
          score: Math.floor(Random.fraction()*10)*5
        });
      }
    }
  });

  Meteor.publish("cards", function() {
    return Cards.find();
  });
}