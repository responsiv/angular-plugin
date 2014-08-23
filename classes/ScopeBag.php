<?php namespace Responsiv\Angular\Classes;

use JsonSerializable;
use Illuminate\Support\Contracts\JsonableInterface;
use Illuminate\Support\Contracts\ArrayableInterface;
use ArrayAccess;
use Countable;

class ScopeBag implements ArrayAccess, ArrayableInterface, Countable, JsonableInterface, JsonSerializable
{

    /**
     * All of the registered variables.
     * @var array
     */
    protected $vars = [];

    /**
     * Add a value to the bag.
     * @param  string  $key
     * @param  string  $value
     * @return $this
     */
    public function add($key, $value)
    {
        if ($value instanceof ArrayableInterface)
            $value = $value->toArray();

        $this->vars[$key] = $value;
        return $this;
    }

    /**
     * Removes a value to the bag.
     * @param  string  $key
     * @param  string  $value
     * @return $this
     */
    public function remove($key)
    {
        unset($this->vars[$key]);
        return $this;
    }

    /**
     * Merge a new array of vars into the bag.
     * @param  array  $vars
     * @return $this
     */
    public function merge($vars)
    {
        $this->vars = array_merge_recursive($this->vars, $vars);
        return $this;
    }

    /**
     * Determine if value exist for a given key.
     * @param  string  $key
     * @return bool
     */
    public function has($key = null)
    {
        return $this->first($key) !== '';
    }

    /**
     * Get the first value from the bag for a given key.
     * @param  string  $key
     * @return string
     */
    public function first($key = null)
    {
        $vars = is_null($key) ? $this->all() : $this->get($key);

        return (count($vars) > 0) ? $vars[0] : '';
    }

    /**
     * Get all of the values from the bag for a given key.
     * @param  string  $key
     * @return array
     */
    public function get($key)
    {
        if (array_key_exists($key, $this->vars))
            return $this->vars[$key];

        return null;
    }

    /**
     * Get all of the values for every key in the bag.
     * @param  string  $format
     * @return array
     */
    public function all()
    {
        return $this->vars;
    }

    /**
     * Determine if the value bag has any vars.
     *
     * @return bool
     */
    public function isEmpty()
    {
        return ! $this->any();
    }

    /**
     * Determine if the value bag has any vars.
     *
     * @return bool
     */
    public function any()
    {
        return $this->count() > 0;
    }

    /**
     * Get the number of vars in the container.
     *
     * @return int
     */
    public function count()
    {
        return count($this->vars);
    }

    /**
     * Determine if the given attribute exists.
     * @param  mixed  $offset
     * @return bool
     */
    public function offsetExists($offset)
    {
        return $this->has($offset);
    }

    /**
     * Get the value for a given offset.
     * @param  mixed  $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        return $this->get($offset);
    }

    /**
     * Set the value for a given offset.
     * @param  mixed  $offset
     * @param  mixed  $value
     * @return void
     */
    public function offsetSet($offset, $value)
    {
        $this->add($offset, $value);
    }

    /**
     * Unset the value for a given offset.
     * @param  mixed  $offset
     * @return void
     */
    public function offsetUnset($offset)
    {
        $this->remove($offset);
    }

    /**
     * Get the instance as an array.
     *
     * @return array
     */
    public function toArray()
    {
        return $this->vars;
    }

    /**
     * Convert the object into something JSON serializable.
     *
     * @return array
     */
    public function jsonSerialize()
    {
        return $this->toArray();
    }

    /**
     * Convert the object to its JSON representation.
     *
     * @param  int  $options
     * @return string
     */
    public function toJson($options = 0)
    {
        return json_encode($this->toArray(), $options);
    }

    /**
     * Convert the value bag to its string representation.
     *
     * @return string
     */
    public function __toString()
    {
        return $this->toJson();
    }

}
