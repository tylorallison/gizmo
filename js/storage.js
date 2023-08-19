export { Storage };

// This file is designed to not crash if access to window.localstorage is not allowed.
// See the end of this file for the exports (they need to be after the definitons)

class Storage {
    static supported = this.is_local_storage_available();

    static is_local_storage_available() {
        try {
            window.localStorage.setItem("check", { something: "ok" });
            window.localStorage.removeItem("check");
            return true;
        } catch(error) {
            return false;
        }
    }

    static set(key, value) {
        try{
            const serialized = JSON.stringify(value);
            if (this.supported) {
                localStorage.setItem(key, serialized);
            } else {
                this.storage[key] = serialized;
            }
        } catch(error){
            console.warn(`failed to set value in storage: ${error}`);
        }
    }

    static get(key){
        try{
            let serialized;
            if (this.supported) {
                serialized = localStorage.getItem(key);
            } else {
                serialized = this.storage[key];
            }
            let value = (typeof serialized === 'string') ? JSON.parse(serialized) : serialized;
            return value;
        } catch(error) {
            console.warn(`failed to get value in storage: ${error}`);
        }
    }

    static remove(key) {
        if (this.supported) {
            localStorage.removeItem(key);
        } else {
            delete this.storage[name];
        }
    }

}