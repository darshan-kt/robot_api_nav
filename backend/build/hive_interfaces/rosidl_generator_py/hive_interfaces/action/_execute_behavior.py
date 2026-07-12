# generated from rosidl_generator_py/resource/_idl.py.em
# with input from hive_interfaces:action/ExecuteBehavior.idl
# generated code does not contain a copyright notice


# Import statements for member types

import builtins  # noqa: E402, I100

import rosidl_parser.definition  # noqa: E402, I100


class Metaclass_ExecuteBehavior_Goal(type):
    """Metaclass of message 'ExecuteBehavior_Goal'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_Goal')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__goal
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__goal
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__goal
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__goal
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__goal

            from geometry_msgs.msg import PoseStamped
            if PoseStamped.__class__._TYPE_SUPPORT is None:
                PoseStamped.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_Goal(metaclass=Metaclass_ExecuteBehavior_Goal):
    """Message class 'ExecuteBehavior_Goal'."""

    __slots__ = [
        '_id',
        '_behavior_name',
        '_task_id',
        '_pose',
        '_json_payload',
    ]

    _fields_and_field_types = {
        'id': 'int32',
        'behavior_name': 'string',
        'task_id': 'string',
        'pose': 'geometry_msgs/PoseStamped',
        'json_payload': 'string',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.BasicType('int32'),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.NamespacedType(['geometry_msgs', 'msg'], 'PoseStamped'),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        self.id = kwargs.get('id', int())
        self.behavior_name = kwargs.get('behavior_name', str())
        self.task_id = kwargs.get('task_id', str())
        from geometry_msgs.msg import PoseStamped
        self.pose = kwargs.get('pose', PoseStamped())
        self.json_payload = kwargs.get('json_payload', str())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.id != other.id:
            return False
        if self.behavior_name != other.behavior_name:
            return False
        if self.task_id != other.task_id:
            return False
        if self.pose != other.pose:
            return False
        if self.json_payload != other.json_payload:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property  # noqa: A003
    def id(self):  # noqa: A003
        """Message field 'id'."""
        return self._id

    @id.setter  # noqa: A003
    def id(self, value):  # noqa: A003
        if __debug__:
            assert \
                isinstance(value, int), \
                "The 'id' field must be of type 'int'"
            assert value >= -2147483648 and value < 2147483648, \
                "The 'id' field must be an integer in [-2147483648, 2147483647]"
        self._id = value

    @builtins.property
    def behavior_name(self):
        """Message field 'behavior_name'."""
        return self._behavior_name

    @behavior_name.setter
    def behavior_name(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'behavior_name' field must be of type 'str'"
        self._behavior_name = value

    @builtins.property
    def task_id(self):
        """Message field 'task_id'."""
        return self._task_id

    @task_id.setter
    def task_id(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'task_id' field must be of type 'str'"
        self._task_id = value

    @builtins.property
    def pose(self):
        """Message field 'pose'."""
        return self._pose

    @pose.setter
    def pose(self, value):
        if __debug__:
            from geometry_msgs.msg import PoseStamped
            assert \
                isinstance(value, PoseStamped), \
                "The 'pose' field must be a sub message of type 'PoseStamped'"
        self._pose = value

    @builtins.property
    def json_payload(self):
        """Message field 'json_payload'."""
        return self._json_payload

    @json_payload.setter
    def json_payload(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'json_payload' field must be of type 'str'"
        self._json_payload = value


# Import statements for member types

# already imported above
# import builtins

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_Result(type):
    """Metaclass of message 'ExecuteBehavior_Result'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_Result')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__result
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__result
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__result
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__result
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__result

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_Result(metaclass=Metaclass_ExecuteBehavior_Result):
    """Message class 'ExecuteBehavior_Result'."""

    __slots__ = [
        '_success',
        '_outcome_text',
        '_log_file',
        '_metrics_json',
    ]

    _fields_and_field_types = {
        'success': 'boolean',
        'outcome_text': 'string',
        'log_file': 'string',
        'metrics_json': 'string',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.BasicType('boolean'),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        self.success = kwargs.get('success', bool())
        self.outcome_text = kwargs.get('outcome_text', str())
        self.log_file = kwargs.get('log_file', str())
        self.metrics_json = kwargs.get('metrics_json', str())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.success != other.success:
            return False
        if self.outcome_text != other.outcome_text:
            return False
        if self.log_file != other.log_file:
            return False
        if self.metrics_json != other.metrics_json:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def success(self):
        """Message field 'success'."""
        return self._success

    @success.setter
    def success(self, value):
        if __debug__:
            assert \
                isinstance(value, bool), \
                "The 'success' field must be of type 'bool'"
        self._success = value

    @builtins.property
    def outcome_text(self):
        """Message field 'outcome_text'."""
        return self._outcome_text

    @outcome_text.setter
    def outcome_text(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'outcome_text' field must be of type 'str'"
        self._outcome_text = value

    @builtins.property
    def log_file(self):
        """Message field 'log_file'."""
        return self._log_file

    @log_file.setter
    def log_file(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'log_file' field must be of type 'str'"
        self._log_file = value

    @builtins.property
    def metrics_json(self):
        """Message field 'metrics_json'."""
        return self._metrics_json

    @metrics_json.setter
    def metrics_json(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'metrics_json' field must be of type 'str'"
        self._metrics_json = value


# Import statements for member types

# already imported above
# import builtins

import math  # noqa: E402, I100

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_Feedback(type):
    """Metaclass of message 'ExecuteBehavior_Feedback'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_Feedback')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__feedback
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__feedback
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__feedback
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__feedback
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__feedback

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_Feedback(metaclass=Metaclass_ExecuteBehavior_Feedback):
    """Message class 'ExecuteBehavior_Feedback'."""

    __slots__ = [
        '_progress_percent',
        '_current_state',
        '_comment',
    ]

    _fields_and_field_types = {
        'progress_percent': 'float',
        'current_state': 'string',
        'comment': 'string',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.BasicType('float'),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
        rosidl_parser.definition.UnboundedString(),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        self.progress_percent = kwargs.get('progress_percent', float())
        self.current_state = kwargs.get('current_state', str())
        self.comment = kwargs.get('comment', str())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.progress_percent != other.progress_percent:
            return False
        if self.current_state != other.current_state:
            return False
        if self.comment != other.comment:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def progress_percent(self):
        """Message field 'progress_percent'."""
        return self._progress_percent

    @progress_percent.setter
    def progress_percent(self, value):
        if __debug__:
            assert \
                isinstance(value, float), \
                "The 'progress_percent' field must be of type 'float'"
            assert not (value < -3.402823466e+38 or value > 3.402823466e+38) or math.isinf(value), \
                "The 'progress_percent' field must be a float in [-3.402823466e+38, 3.402823466e+38]"
        self._progress_percent = value

    @builtins.property
    def current_state(self):
        """Message field 'current_state'."""
        return self._current_state

    @current_state.setter
    def current_state(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'current_state' field must be of type 'str'"
        self._current_state = value

    @builtins.property
    def comment(self):
        """Message field 'comment'."""
        return self._comment

    @comment.setter
    def comment(self, value):
        if __debug__:
            assert \
                isinstance(value, str), \
                "The 'comment' field must be of type 'str'"
        self._comment = value


# Import statements for member types

# already imported above
# import builtins

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_SendGoal_Request(type):
    """Metaclass of message 'ExecuteBehavior_SendGoal_Request'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_SendGoal_Request')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__send_goal__request
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__send_goal__request
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__send_goal__request
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__send_goal__request
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__send_goal__request

            from hive_interfaces.action import ExecuteBehavior
            if ExecuteBehavior.Goal.__class__._TYPE_SUPPORT is None:
                ExecuteBehavior.Goal.__class__.__import_type_support__()

            from unique_identifier_msgs.msg import UUID
            if UUID.__class__._TYPE_SUPPORT is None:
                UUID.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_SendGoal_Request(metaclass=Metaclass_ExecuteBehavior_SendGoal_Request):
    """Message class 'ExecuteBehavior_SendGoal_Request'."""

    __slots__ = [
        '_goal_id',
        '_goal',
    ]

    _fields_and_field_types = {
        'goal_id': 'unique_identifier_msgs/UUID',
        'goal': 'hive_interfaces/ExecuteBehavior_Goal',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.NamespacedType(['unique_identifier_msgs', 'msg'], 'UUID'),  # noqa: E501
        rosidl_parser.definition.NamespacedType(['hive_interfaces', 'action'], 'ExecuteBehavior_Goal'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        from unique_identifier_msgs.msg import UUID
        self.goal_id = kwargs.get('goal_id', UUID())
        from hive_interfaces.action._execute_behavior import ExecuteBehavior_Goal
        self.goal = kwargs.get('goal', ExecuteBehavior_Goal())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.goal_id != other.goal_id:
            return False
        if self.goal != other.goal:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def goal_id(self):
        """Message field 'goal_id'."""
        return self._goal_id

    @goal_id.setter
    def goal_id(self, value):
        if __debug__:
            from unique_identifier_msgs.msg import UUID
            assert \
                isinstance(value, UUID), \
                "The 'goal_id' field must be a sub message of type 'UUID'"
        self._goal_id = value

    @builtins.property
    def goal(self):
        """Message field 'goal'."""
        return self._goal

    @goal.setter
    def goal(self, value):
        if __debug__:
            from hive_interfaces.action._execute_behavior import ExecuteBehavior_Goal
            assert \
                isinstance(value, ExecuteBehavior_Goal), \
                "The 'goal' field must be a sub message of type 'ExecuteBehavior_Goal'"
        self._goal = value


# Import statements for member types

# already imported above
# import builtins

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_SendGoal_Response(type):
    """Metaclass of message 'ExecuteBehavior_SendGoal_Response'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_SendGoal_Response')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__send_goal__response
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__send_goal__response
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__send_goal__response
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__send_goal__response
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__send_goal__response

            from builtin_interfaces.msg import Time
            if Time.__class__._TYPE_SUPPORT is None:
                Time.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_SendGoal_Response(metaclass=Metaclass_ExecuteBehavior_SendGoal_Response):
    """Message class 'ExecuteBehavior_SendGoal_Response'."""

    __slots__ = [
        '_accepted',
        '_stamp',
    ]

    _fields_and_field_types = {
        'accepted': 'boolean',
        'stamp': 'builtin_interfaces/Time',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.BasicType('boolean'),  # noqa: E501
        rosidl_parser.definition.NamespacedType(['builtin_interfaces', 'msg'], 'Time'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        self.accepted = kwargs.get('accepted', bool())
        from builtin_interfaces.msg import Time
        self.stamp = kwargs.get('stamp', Time())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.accepted != other.accepted:
            return False
        if self.stamp != other.stamp:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def accepted(self):
        """Message field 'accepted'."""
        return self._accepted

    @accepted.setter
    def accepted(self, value):
        if __debug__:
            assert \
                isinstance(value, bool), \
                "The 'accepted' field must be of type 'bool'"
        self._accepted = value

    @builtins.property
    def stamp(self):
        """Message field 'stamp'."""
        return self._stamp

    @stamp.setter
    def stamp(self, value):
        if __debug__:
            from builtin_interfaces.msg import Time
            assert \
                isinstance(value, Time), \
                "The 'stamp' field must be a sub message of type 'Time'"
        self._stamp = value


class Metaclass_ExecuteBehavior_SendGoal(type):
    """Metaclass of service 'ExecuteBehavior_SendGoal'."""

    _TYPE_SUPPORT = None

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_SendGoal')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._TYPE_SUPPORT = module.type_support_srv__action__execute_behavior__send_goal

            from hive_interfaces.action import _execute_behavior
            if _execute_behavior.Metaclass_ExecuteBehavior_SendGoal_Request._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_SendGoal_Request.__import_type_support__()
            if _execute_behavior.Metaclass_ExecuteBehavior_SendGoal_Response._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_SendGoal_Response.__import_type_support__()


class ExecuteBehavior_SendGoal(metaclass=Metaclass_ExecuteBehavior_SendGoal):
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_SendGoal_Request as Request
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_SendGoal_Response as Response

    def __init__(self):
        raise NotImplementedError('Service classes can not be instantiated')


# Import statements for member types

# already imported above
# import builtins

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_GetResult_Request(type):
    """Metaclass of message 'ExecuteBehavior_GetResult_Request'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_GetResult_Request')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__get_result__request
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__get_result__request
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__get_result__request
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__get_result__request
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__get_result__request

            from unique_identifier_msgs.msg import UUID
            if UUID.__class__._TYPE_SUPPORT is None:
                UUID.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_GetResult_Request(metaclass=Metaclass_ExecuteBehavior_GetResult_Request):
    """Message class 'ExecuteBehavior_GetResult_Request'."""

    __slots__ = [
        '_goal_id',
    ]

    _fields_and_field_types = {
        'goal_id': 'unique_identifier_msgs/UUID',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.NamespacedType(['unique_identifier_msgs', 'msg'], 'UUID'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        from unique_identifier_msgs.msg import UUID
        self.goal_id = kwargs.get('goal_id', UUID())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.goal_id != other.goal_id:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def goal_id(self):
        """Message field 'goal_id'."""
        return self._goal_id

    @goal_id.setter
    def goal_id(self, value):
        if __debug__:
            from unique_identifier_msgs.msg import UUID
            assert \
                isinstance(value, UUID), \
                "The 'goal_id' field must be a sub message of type 'UUID'"
        self._goal_id = value


# Import statements for member types

# already imported above
# import builtins

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_GetResult_Response(type):
    """Metaclass of message 'ExecuteBehavior_GetResult_Response'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_GetResult_Response')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__get_result__response
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__get_result__response
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__get_result__response
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__get_result__response
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__get_result__response

            from hive_interfaces.action import ExecuteBehavior
            if ExecuteBehavior.Result.__class__._TYPE_SUPPORT is None:
                ExecuteBehavior.Result.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_GetResult_Response(metaclass=Metaclass_ExecuteBehavior_GetResult_Response):
    """Message class 'ExecuteBehavior_GetResult_Response'."""

    __slots__ = [
        '_status',
        '_result',
    ]

    _fields_and_field_types = {
        'status': 'int8',
        'result': 'hive_interfaces/ExecuteBehavior_Result',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.BasicType('int8'),  # noqa: E501
        rosidl_parser.definition.NamespacedType(['hive_interfaces', 'action'], 'ExecuteBehavior_Result'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        self.status = kwargs.get('status', int())
        from hive_interfaces.action._execute_behavior import ExecuteBehavior_Result
        self.result = kwargs.get('result', ExecuteBehavior_Result())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.status != other.status:
            return False
        if self.result != other.result:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def status(self):
        """Message field 'status'."""
        return self._status

    @status.setter
    def status(self, value):
        if __debug__:
            assert \
                isinstance(value, int), \
                "The 'status' field must be of type 'int'"
            assert value >= -128 and value < 128, \
                "The 'status' field must be an integer in [-128, 127]"
        self._status = value

    @builtins.property
    def result(self):
        """Message field 'result'."""
        return self._result

    @result.setter
    def result(self, value):
        if __debug__:
            from hive_interfaces.action._execute_behavior import ExecuteBehavior_Result
            assert \
                isinstance(value, ExecuteBehavior_Result), \
                "The 'result' field must be a sub message of type 'ExecuteBehavior_Result'"
        self._result = value


class Metaclass_ExecuteBehavior_GetResult(type):
    """Metaclass of service 'ExecuteBehavior_GetResult'."""

    _TYPE_SUPPORT = None

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_GetResult')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._TYPE_SUPPORT = module.type_support_srv__action__execute_behavior__get_result

            from hive_interfaces.action import _execute_behavior
            if _execute_behavior.Metaclass_ExecuteBehavior_GetResult_Request._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_GetResult_Request.__import_type_support__()
            if _execute_behavior.Metaclass_ExecuteBehavior_GetResult_Response._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_GetResult_Response.__import_type_support__()


class ExecuteBehavior_GetResult(metaclass=Metaclass_ExecuteBehavior_GetResult):
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_GetResult_Request as Request
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_GetResult_Response as Response

    def __init__(self):
        raise NotImplementedError('Service classes can not be instantiated')


# Import statements for member types

# already imported above
# import builtins

# already imported above
# import rosidl_parser.definition


class Metaclass_ExecuteBehavior_FeedbackMessage(type):
    """Metaclass of message 'ExecuteBehavior_FeedbackMessage'."""

    _CREATE_ROS_MESSAGE = None
    _CONVERT_FROM_PY = None
    _CONVERT_TO_PY = None
    _DESTROY_ROS_MESSAGE = None
    _TYPE_SUPPORT = None

    __constants = {
    }

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior_FeedbackMessage')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._CREATE_ROS_MESSAGE = module.create_ros_message_msg__action__execute_behavior__feedback_message
            cls._CONVERT_FROM_PY = module.convert_from_py_msg__action__execute_behavior__feedback_message
            cls._CONVERT_TO_PY = module.convert_to_py_msg__action__execute_behavior__feedback_message
            cls._TYPE_SUPPORT = module.type_support_msg__action__execute_behavior__feedback_message
            cls._DESTROY_ROS_MESSAGE = module.destroy_ros_message_msg__action__execute_behavior__feedback_message

            from hive_interfaces.action import ExecuteBehavior
            if ExecuteBehavior.Feedback.__class__._TYPE_SUPPORT is None:
                ExecuteBehavior.Feedback.__class__.__import_type_support__()

            from unique_identifier_msgs.msg import UUID
            if UUID.__class__._TYPE_SUPPORT is None:
                UUID.__class__.__import_type_support__()

    @classmethod
    def __prepare__(cls, name, bases, **kwargs):
        # list constant names here so that they appear in the help text of
        # the message class under "Data and other attributes defined here:"
        # as well as populate each message instance
        return {
        }


class ExecuteBehavior_FeedbackMessage(metaclass=Metaclass_ExecuteBehavior_FeedbackMessage):
    """Message class 'ExecuteBehavior_FeedbackMessage'."""

    __slots__ = [
        '_goal_id',
        '_feedback',
    ]

    _fields_and_field_types = {
        'goal_id': 'unique_identifier_msgs/UUID',
        'feedback': 'hive_interfaces/ExecuteBehavior_Feedback',
    }

    SLOT_TYPES = (
        rosidl_parser.definition.NamespacedType(['unique_identifier_msgs', 'msg'], 'UUID'),  # noqa: E501
        rosidl_parser.definition.NamespacedType(['hive_interfaces', 'action'], 'ExecuteBehavior_Feedback'),  # noqa: E501
    )

    def __init__(self, **kwargs):
        assert all('_' + key in self.__slots__ for key in kwargs.keys()), \
            'Invalid arguments passed to constructor: %s' % \
            ', '.join(sorted(k for k in kwargs.keys() if '_' + k not in self.__slots__))
        from unique_identifier_msgs.msg import UUID
        self.goal_id = kwargs.get('goal_id', UUID())
        from hive_interfaces.action._execute_behavior import ExecuteBehavior_Feedback
        self.feedback = kwargs.get('feedback', ExecuteBehavior_Feedback())

    def __repr__(self):
        typename = self.__class__.__module__.split('.')
        typename.pop()
        typename.append(self.__class__.__name__)
        args = []
        for s, t in zip(self.__slots__, self.SLOT_TYPES):
            field = getattr(self, s)
            fieldstr = repr(field)
            # We use Python array type for fields that can be directly stored
            # in them, and "normal" sequences for everything else.  If it is
            # a type that we store in an array, strip off the 'array' portion.
            if (
                isinstance(t, rosidl_parser.definition.AbstractSequence) and
                isinstance(t.value_type, rosidl_parser.definition.BasicType) and
                t.value_type.typename in ['float', 'double', 'int8', 'uint8', 'int16', 'uint16', 'int32', 'uint32', 'int64', 'uint64']
            ):
                if len(field) == 0:
                    fieldstr = '[]'
                else:
                    assert fieldstr.startswith('array(')
                    prefix = "array('X', "
                    suffix = ')'
                    fieldstr = fieldstr[len(prefix):-len(suffix)]
            args.append(s[1:] + '=' + fieldstr)
        return '%s(%s)' % ('.'.join(typename), ', '.join(args))

    def __eq__(self, other):
        if not isinstance(other, self.__class__):
            return False
        if self.goal_id != other.goal_id:
            return False
        if self.feedback != other.feedback:
            return False
        return True

    @classmethod
    def get_fields_and_field_types(cls):
        from copy import copy
        return copy(cls._fields_and_field_types)

    @builtins.property
    def goal_id(self):
        """Message field 'goal_id'."""
        return self._goal_id

    @goal_id.setter
    def goal_id(self, value):
        if __debug__:
            from unique_identifier_msgs.msg import UUID
            assert \
                isinstance(value, UUID), \
                "The 'goal_id' field must be a sub message of type 'UUID'"
        self._goal_id = value

    @builtins.property
    def feedback(self):
        """Message field 'feedback'."""
        return self._feedback

    @feedback.setter
    def feedback(self, value):
        if __debug__:
            from hive_interfaces.action._execute_behavior import ExecuteBehavior_Feedback
            assert \
                isinstance(value, ExecuteBehavior_Feedback), \
                "The 'feedback' field must be a sub message of type 'ExecuteBehavior_Feedback'"
        self._feedback = value


class Metaclass_ExecuteBehavior(type):
    """Metaclass of action 'ExecuteBehavior'."""

    _TYPE_SUPPORT = None

    @classmethod
    def __import_type_support__(cls):
        try:
            from rosidl_generator_py import import_type_support
            module = import_type_support('hive_interfaces')
        except ImportError:
            import logging
            import traceback
            logger = logging.getLogger(
                'hive_interfaces.action.ExecuteBehavior')
            logger.debug(
                'Failed to import needed modules for type support:\n' +
                traceback.format_exc())
        else:
            cls._TYPE_SUPPORT = module.type_support_action__action__execute_behavior

            from action_msgs.msg import _goal_status_array
            if _goal_status_array.Metaclass_GoalStatusArray._TYPE_SUPPORT is None:
                _goal_status_array.Metaclass_GoalStatusArray.__import_type_support__()
            from action_msgs.srv import _cancel_goal
            if _cancel_goal.Metaclass_CancelGoal._TYPE_SUPPORT is None:
                _cancel_goal.Metaclass_CancelGoal.__import_type_support__()

            from hive_interfaces.action import _execute_behavior
            if _execute_behavior.Metaclass_ExecuteBehavior_SendGoal._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_SendGoal.__import_type_support__()
            if _execute_behavior.Metaclass_ExecuteBehavior_GetResult._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_GetResult.__import_type_support__()
            if _execute_behavior.Metaclass_ExecuteBehavior_FeedbackMessage._TYPE_SUPPORT is None:
                _execute_behavior.Metaclass_ExecuteBehavior_FeedbackMessage.__import_type_support__()


class ExecuteBehavior(metaclass=Metaclass_ExecuteBehavior):

    # The goal message defined in the action definition.
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_Goal as Goal
    # The result message defined in the action definition.
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_Result as Result
    # The feedback message defined in the action definition.
    from hive_interfaces.action._execute_behavior import ExecuteBehavior_Feedback as Feedback

    class Impl:

        # The send_goal service using a wrapped version of the goal message as a request.
        from hive_interfaces.action._execute_behavior import ExecuteBehavior_SendGoal as SendGoalService
        # The get_result service using a wrapped version of the result message as a response.
        from hive_interfaces.action._execute_behavior import ExecuteBehavior_GetResult as GetResultService
        # The feedback message with generic fields which wraps the feedback message.
        from hive_interfaces.action._execute_behavior import ExecuteBehavior_FeedbackMessage as FeedbackMessage

        # The generic service to cancel a goal.
        from action_msgs.srv._cancel_goal import CancelGoal as CancelGoalService
        # The generic message for get the status of a goal.
        from action_msgs.msg._goal_status_array import GoalStatusArray as GoalStatusMessage

    def __init__(self):
        raise NotImplementedError('Action classes can not be instantiated')
