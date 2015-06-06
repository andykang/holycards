/**
 * Port of the leaderboard example to use React for rendering.
 *
 * This directive is necessary to enable preprocessing of JSX tags:
 * @jsx React.DOM
 */

var cx = React.addons.classSet;

// Set up a collection to contain bulletin cards. On the server,
// it is backed by a MongoDB collection named "cards".
Cards = new Meteor.Collection("cards");

Meteor.methods({
  addCard: function(text) {
    return Cards.insert({text: text});
  }
});


var UserSelect = React.createClass({
  getInitialState: function() {
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
    var view =  [
      <div class="user-select" onClick={this.toggleUserType}>
        Switch to {this.state.userType} View
      </div>
    ];

    if (this.state.userType === "Admin") {
      view.push(
        <div id="new-card">
          <NewCard/>
        </div>
      );
    };

    return  <div class="control">
              {view}
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

    return <Card
      key={model._id}
      name={model.text}
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

    return <div className="inner">
            <UserSelect />
            { children }
          </div>;
  }
});

var Card = React.createClass({
  shouldComponentUpdate: function(nextProps, nextState){
    var { name, score, ...rest } = this.props;
    return name !== nextProps.name || score !== nextProps.score || rest.className !== nextProps.className;
  },
  render: function() {
    var { name, ...rest } = this.props;
    return <div {...rest} className={cx("card", rest.className)}>
      <span className="name">{name}</span>
    </div>;
  }
});

// START ANDY'S CODE

var NewCard = React.createClass({
  render: function() {
    return <div><BodyTextCardForm/><TimeSelector/></div>;
  }
});

var BodyTextCardForm = React.createClass({
  getInitialState: function() {
    return {text: 'Hello!'};
  },

  handleKeyDown: function(event) {
    var key = event.which || event.keyCode;
    if (key === 13) {
      var id = Meteor.call("addCard", this.state.text);
      this.setState({text: ""});
      event.preventDefault();
    }
  },

  handleChange: function(event) {
      this.setState({text: event.target.value});
  },

  render: function() {
    var text = this.state.text;
    return  <textarea class="new-card" onKeyDown={this.handleKeyDown} onChange={this.handleChange} value={text} />
  }
});

var ScheduleCardForm = React.createClass({
  render: function() {
    return;
  }
});

var TimeSelector = React.createClass({
  getCurrentTimeStr: function() {
    var now = new Date(),
        hours = now.getHours(),
        minutes = now.getMinutes(),
        isPm = now.getHours() > 12;
    return (isPm ? hours - 12 : hours) + ':' + minutes + ' ' + (isPm ? 'PM' : 'AM');
  },
  getInitialState: function() {
    return {
      time: this.getCurrentTimeStr(),
      text: this.getCurrentTimeStr()
    };
  },
  validateTime: function(event) {
    // validate time
    var value = event.target.value;
    if (value.match(/^[01]?\d:[0-5]\d [AP]M$/)) {
      this.setState({time: value});
    } else {
      this.setState({text: this.state.time});
    }
  },
  handleChange: function(event) {
    this.setState({text: event.target.value});
  },
  render: function() {
    var time = this.state.time;
    var text = this.state.text;
    return <input type="text" value={text} onChange={this.handleChange} onBlur={this.validateTime} />;
  }
});

// END ANDY'S CODE

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


