//Errors

import React from 'react'
import ReactDOM from 'react-dom'

import {
  Nav,
  NavItem,
  Navbar,
  Button,
  Glyphicon,
  Panel,
  Table,
  Modal,
  Popover,
  Tooltip,
  OverlayTrigger,
  Form,
  FormGroup,
  FormControl,
  Checkbox,
  Col,
  Row,
  ControlLabel,
  Alert,
  FlatButton,
  Link,
  ListGroupItem,
  Label
} from 'react-bootstrap'

import DatePicker from 'react-bootstrap-date-picker'
import TimePicker from 'react-bootstrap-time-picker'
import moment from 'moment'
import dateformat from 'dateformat'
import classnames from 'classnames'

import _ from 'lodash'

import style from './style.scss'

const broadcastTypes = {
  text: '',
  javascript: '',
  'facebook-text-quick-replies': `bp.messenger.sendText(userId, '<YOUR TEXT HERE>', {
  quick_replies: ['<QUICK_REPLY1>', '<QUICK_REPLY2>']
})`,
  'facebook-attachment': `bp.messenger.sendAttachment(userId, 'image', '<URL>')`
}

export default class BroadcastModule extends React.Component {

constructor(props){
    super(props)

    this.state = {
      loading: true,
      showModalForm: false,
      broadcast: {}
    }

    this.handleAddBroadcast = this.handleAddBroadcast.bind(this)
    this.handleModifyBroadcast = this.handleModifyBroadcast.bind(this)
    this.handleRemoveBroadcast = this.handleRemoveBroadcast.bind(this)
    this.handleOpenModalForm = this.handleOpenModalForm.bind(this)
    this.handleCloseModalForm = this.handleCloseModalForm.bind(this)
    this.handleSelectChange = this.handleSelectChange.bind(this)
    this.handleContentChange = this.handleContentChange.bind(this)
    this.handleDateChange = this.handleDateChange.bind(this)
    this.handleTimeChange = this.handleTimeChange.bind(this)
    this.handleUserTimezoneChange = this.handleUserTimezoneChange.bind(this)
    this.handleRequestError = this.handleRequestError.bind(this)

    this.renderFilteringConditionElement = this.renderFilteringConditionElement.bind(this)
    this.handleAddToFilteringConditions = this.handleAddToFilteringConditions.bind(this)
    this.handleRemoveFromFilteringConditions = this.handleRemoveFromFilteringConditions.bind(this)

    this.fetchAllBroadcasts = this.fetchAllBroadcasts.bind(this)
    this.closeModal = this.closeModal.bind(this)
  }

  getAxios() {
    return this.props.bp.axios
  }

  componentDidMount(){
    this.fetchAllBroadcasts()
    this.props.bp.events.on('broadcast.changed', this.fetchAllBroadcasts)
  }

  componentWillUnmount(){
    this.props.bp.events.off('broadcast.changed', this.fetchAllBroadcasts)
  }

  fetchAllBroadcasts() {
    this.setState({ loading: true })

    return this.getAxios().get("/api/botpress-broadcast/broadcasts")
    .then((res) => {
      this.setState({
        loading: false,
        broadcasts: _.orderBy(res.data, ['date', 'time'])
      })
    })
  }

  extractBroadcastFromModal() {
    const { type, content, date, userTimezone, time, filteringConditions } = this.state.broadcast
    return {
      date: moment(date).format('YYYY-MM-DD'),
      time: moment().startOf('day').add(time, 'seconds').format('HH:mm'),
      content: content,
      type: type,
      timezone: userTimezone ? null : moment().format('Z'),
      filters: filteringConditions
    }
  }

  closeModal() {
    this.setState({ showModalForm: false, error: null })
    return Promise.resolve(true)
  }

  handleRequestError(err) {
    if (err && err.response) {
      return this.setState({
        loading: false,
        error: err.response.data.message
      })
    }

    this.setState({
      loading: false,
      error: err ? err.message : 'An unknown error occured'
    })
  }

  handleAddBroadcast() {
    const broadcast = this.extractBroadcastFromModal()
    this.getAxios().put("/api/botpress-broadcast/broadcasts", broadcast)
    .then(this.fetchAllBroadcasts)
    .then(this.closeModal)
    .catch(this.handleRequestError)
  }

  handleModifyBroadcast() {
    const broadcast = this.extractBroadcastFromModal()
    const { broadcastId: id } = this.state
    this.getAxios().post("/api/botpress-broadcast/broadcasts", { id, ...broadcast })
    .then(this.fetchAllBroadcasts)
    .then(this.closeModal)
    .catch(this.handleRequestError)
  }

  handleRemoveBroadcast(id) {
    this.getAxios().delete("/api/botpress-broadcast/broadcasts/" + id)
    .then(this.fetchAllBroadcasts)
    .catch(this.handleRequestError)
  }

  handleCloseModalForm() {
    this.setState({ showModalForm: false })
  }

  handleOpenModalForm(broadcast, id) {
    if(!id) {
      id = null
    }

    if(!broadcast) {
      broadcast = {
        type: 'text',
        content: '',
        date: new Date().toISOString(),
        time: 0,
        progress: 0,
        userTimezone: true,
        filteringConditions:[]
      }
    }

    this.setState({
      modifyBroadcast: !id ? false : true,
      showModalForm: true,

      broadcastId: id,
      broadcast: {
        type: broadcast.type,
        content: broadcast.content,
        userTimezone: broadcast.userTimezone,
        date: broadcast.date,
        time: broadcast.time,
        filteringConditions : broadcast.filteringConditions,
        progress: broadcast.progress
      }
    })
  }

  handleSelectChange(event) {
    var newBroadcast = this.state.broadcast
    const oldTypeContent = broadcastTypes[newBroadcast.type] || ''

    newBroadcast.type = event.target.value

    if (newBroadcast.content === oldTypeContent) {
      newBroadcast.content = broadcastTypes[newBroadcast.type]
    }

    this.setState({
      broadcast: newBroadcast
    })
  }

  handleContentChange(event) {
    var newBroadcast = this.state.broadcast
    newBroadcast.content = event.target.value
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleDateChange(value) {
    var newBroadcast = this.state.broadcast
    newBroadcast.date = value
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleTimeChange(value) {
    var newBroadcast = this.state.broadcast
    newBroadcast.time = value

    this.setState({
      broadcast: newBroadcast
    });
  }

  handleUserTimezoneChange() {
    var newBroadcast = this.state.broadcast
    newBroadcast.userTimezone = !newBroadcast.userTimezone
    this.setState({
      broadcast: newBroadcast
    })
  }

  handleAddToFilteringConditions() {
    const input = ReactDOM.findDOMNode(this.filterInput)
    if (input && input.value !== '') {
      var newBroadcast = this.state.broadcast
      newBroadcast.filteringConditions = _.concat(newBroadcast.filteringConditions, input.value)

      this.setState({
        broadcast: newBroadcast
      })
      input.value = ''
    }
  }

  handleRemoveFromFilteringConditions(filter) {
    var newBroadcast = this.state.broadcast
    newBroadcast.filteringConditions = _.without(newBroadcast.filteringConditions, filter)

    this.setState({
      broadcast: newBroadcast
    })
  }

  renderTableHeader() {
    return (
      <thead>
        <tr>
          <th>#</th>
          <th>Date</th>
          <th>Type</th>
          <th>Content</th>
          <th>Filters</th>
          <th>Progress</th>
          <th>Action</th>
        </tr>
      </thead>
    )
  }

  renderBroadcasts(broadcasts) {
    const getDateFormatted = (time, date, userTimezone) => {
      const calendar = moment(date + ' ' + time, 'YYYY-MM-DD HH:mm').calendar()
      return calendar + (userTimezone ? ' (users time)' : ' (your time)')
    }

    const formatProgress = (progress, outboxed, errored) => {
      let color = '#90a9f4'
      let text = (progress * 100).toFixed(2) + '%'
      if(progress === 0) {
        text = outboxed ? 'Processing' : 'Not started'
        color = outboxed ? '#90a9f4' : '#e4e4e4'
      }
      if(progress === 1) {
        text = 'Done'
        color = '#6ee681'
      }
      if(errored){
        text = 'Error'
        color = '#eb6f6f'
      }
      return <div><div className={style.dot} style={{backgroundColor:color}}></div>{text}</div>
    }

    const renderModificationButton = (value) => {
      return (
        <button className={classnames('bp-button', style.smallButton)}
          onClick={() => this.handleOpenModalForm(value, value.id)}>
          <Glyphicon glyph='file' />
        </button>
      )
    }

    const renderFilteringCondition = (filters) => {
      if (_.isEmpty(filters)) {
        return 'No filter'
      }

      return <Label bsStyle="primary">
        {filters.length + ' filters'}
      </Label>
    }

    return _.mapValues(broadcasts, (value) => {
      return (
        <tr key={value.id}>
          <td style={{width:'5%'}}>{value.id}</td>
          <td style={{width:'22%'}} className={style.scheduledDate}>{getDateFormatted(value.time, value.date, value.userTimezone)}</td>
          <td style={{width:'6%'}}>{value.type}</td>
          <td style={{maxWidth:'32%'}}>{value.content}</td>
          <td style={{width: '7%'}}>{renderFilteringCondition(value.filteringConditions)}</td>
          <td style={{width:'12%'}} className={style.progress}>{formatProgress(value.progress, value.outboxed, value.errored) }</td>
          <td style={{width:'12%'}}>
            {!value.outboxed ? renderModificationButton(value) : null}
            <button className={classnames('bp-button', style.smallButton)}
            onClick={() => this.handleOpenModalForm(value)}>
              <Glyphicon glyph='copy' />
            </button>
            <button className={classnames('bp-button', style.smallButton)}
            onClick={() => this.handleRemoveBroadcast(value.id)}>
              <Glyphicon glyph='trash' />
            </button>
          </td>
        </tr>
      )
    })
  }

  renderTable(broadcasts) {
    return (
      <Table striped bordered condensed hover className={style.scheduledTable}>
        {this.renderTableHeader()}
        <tbody>
          {_.values(this.renderBroadcasts(broadcasts))}
        </tbody>
      </Table>
    )
  }

  renderEmptyMessage() {
    return (
      <div className={style.emptyMessage}>
        <h5>You have no broadcasts...</h5>
      </div>
    )
  }

  renderBroadcastsPanel(title, broadcasts) {
    return (
      <Panel header={title}>
        {_.isEmpty(broadcasts) ? this.renderEmptyMessage() : this.renderTable(broadcasts)}
      </Panel>
    )
  }

  renderTypeList() {
    return _.mapValues(broadcastTypes, (value, key) => {
      return <option key={key} value={key}>{key}</option>
    })
  }

  renderFormType() {
    return (
      <FormGroup controlId="formType">
        <Col componentClass={ControlLabel} sm={2}>
          Type
        </Col>
        <Col sm={10}>
          <FormControl componentClass="select" onChange={this.handleSelectChange} value={this.state.broadcast.type}>
            {_.values(this.renderTypeList())}
          </FormControl>
        </Col>
      </FormGroup>
    )
  }

  renderFormContent() {
    return (
      <FormGroup controlId="formContent">
        <Col componentClass={ControlLabel} sm={2}>
          Content
        </Col>
        <Col sm={10}>
          <FormControl componentClass="textarea"
            value={this.state.broadcast.content}
            onChange={this.handleContentChange}/>
        </Col>
      </FormGroup>
    )
  }

  renderFormDate() {
    const getISODate = (date) => {
      if(date) {
        return new Date(date).toISOString()
      }
      return new Date().toISOString()
    }

    return (
      <FormGroup controlId="formDate">
        <Col componentClass={ControlLabel} sm={2}>
          Date
        </Col>
        <Col sm={10}>
        <DatePicker
          value={getISODate(this.state.broadcast.date)}
          onChange={this.handleDateChange}/>
        </Col>
      </FormGroup>
    )
  }

  renderFormTime() {
    return (
      <FormGroup controlId="formTime">
        <Col componentClass={ControlLabel} sm={2}>
          Time
        </Col>
        <Col sm={10}>
          <TimePicker step={30} onChange={this.handleTimeChange} value={this.state.broadcast.time}/>
        </Col>
      </FormGroup>
    )
  }

  renderFormUserTimezone() {
    return (
      <FormGroup controlId="formUserTimezone">
        <Col componentClass={ControlLabel} sm={2}>
          User time zone
        </Col>
        <Col sm={10}>
          <Checkbox name='userTimezone' checked={this.state.broadcast.userTimezone}
            onChange={this.handleUserTimezoneChange} />
        </Col>
      </FormGroup>
    )
  }

  renderFilteringConditionElement(filter) {
    const removeHandler = () => this.handleRemoveFromFilteringConditions(filter)

    return <ListGroupItem key={filter}>
      {filter}
      <Glyphicon className="pull-right" glyph="remove" onClick={removeHandler} />
    </ListGroupItem>
  }


  renderFiltering() {
    let filteringConditionElements = <ControlLabel>No filtering condition</ControlLabel>

    const filters = this.state.broadcast.filteringConditions
    if (filters && !_.isEmpty(filters)) {
      filteringConditionElements = this.state.broadcast.filteringConditions.map(this.renderFilteringConditionElement)
    }

    return <div>
      <FormGroup controlId="filtering">
        <Col componentClass={ControlLabel} sm={2}>
          Filtering conditions
        </Col>
        <Col sm={10}>
          {filteringConditionElements}
        </Col>
      </FormGroup>
      <FormGroup>
        <Col smOffset={2} sm={10}>
          <ControlLabel>Add a new filter:</ControlLabel>
          <FormControl ref={(input) => this.filterInput = input} type="text"/>
          <Button className='bp-button' onClick={() => this.handleAddToFilteringConditions()}>
            Add
          </Button>
        </Col>
      </FormGroup>
    </div>
  }

  renderForm() {
    return (
      <Form horizontal>
        {this.renderFormType()}
        {this.renderFormContent()}
        {this.renderFormDate()}
        {this.renderFormTime()}
        {this.renderFormUserTimezone()}
        {this.renderFiltering()}
      </Form>
    )
  }

  renderActionButton() {
    const onClickAction = this.state.modifyBroadcast ? this.handleModifyBroadcast : this.handleAddBroadcast
    const buttonName = this.state.modifyBroadcast ? 'Modify' : 'Create'

    return <button className='bp-button' action='' onClick={onClickAction}>{buttonName}</button>
  }

  renderModalForm () {
    return (
      <Modal container={document.getElementById('app')}
        show={this.state.showModalForm}
        onHide={this.handleCloseModalForm}>
        <Modal.Header closeButton>
          <Modal.Title>{this.state.modifyBroadcast ? 'Modify broadcast...' : 'Create new broadcast...'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderForm()}
          </Modal.Body>
        <Modal.Footer>
          {this.renderActionButton()}
          <button className='bp-button bp-button-danger' onClick={this.handleCloseModalForm}>Cancel</button>
        </Modal.Footer>
      </Modal>
    )
  }

  renderNavBar() {
    return (
      <Navbar fluid collapseOnSelect className={style.navbar}>
        <Navbar.Collapse>
          <Nav pullRight>
            <NavItem>
              <button className={classnames('pull-right', 'bp-button', style.smallButton)}
                onClick={() => this.handleOpenModalForm()}>
                <Glyphicon glyph='plus'></Glyphicon>
              </button>
            </NavItem>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }

  renderErrorBox() {

    const AlertDismissable = React.createClass({
      getInitialState() {
        return {
          alertVisible: true
        };
      },

      render() {
        if (this.state.alertVisible) {
          return (
            <Alert bsStyle="danger" onDismiss={this.handleAlertDismiss}>
              <h4>An error occured in some broadcasts</h4>
              <p>If you want to know what happen exactly, take a look to your logs. All details of the errors have been printed in it...</p>
              <p>
                <Button href="../logs">Look to logs</Button>
                <span> or </span>
                <Button onClick={this.handleAlertDismiss}>Hide Alert</Button>
              </p>
            </Alert>
          )
        }
        return null
      },

      handleAlertDismiss() {
        this.setState({alertVisible: false});
      },

      handleAlertShow() {
        this.setState({alertVisible: true});
      }
    });

    return (
      <AlertDismissable />
    )
  }


  render() {
    if (this.state.loading) {
      return null
    }

    const allBroadcasts = _.assign([], this.state.broadcasts)
    let hasSomeError = _.some(allBroadcasts, ['errored', true])

    const upcomingBroadcasts = _.remove(allBroadcasts, function(value) {
      const datetime = moment(value.date + ' ' + value.time, 'YYYY-MM-DD HH:mm')
      return datetime.isBefore(moment().add(3, 'days')) &&
        datetime.isAfter(moment())
    })

    const pastBroadcasts = _.remove(allBroadcasts, function(value) {
      const datetime = moment(value.date + ' ' + value.time, 'YYYY-MM-DD HH:mm')
      return datetime.isBefore(moment()) &&
        datetime.isAfter(moment().subtract(3, 'days'))
    })

    return (
      <div>
        {this.renderNavBar()}
        <Panel className={style.mainPanel}>
          {hasSomeError ? this.renderErrorBox() : null}
          {this.renderBroadcastsPanel('Upcoming (next 3 days)', upcomingBroadcasts)}
          {this.renderBroadcastsPanel('Past (last 3 days)', pastBroadcasts)}
          {this.renderBroadcastsPanel('Other broadcasts', allBroadcasts)}
        </Panel>
        {this.renderModalForm()}
      </div>
    )
  }
}
