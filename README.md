# n8n-nodes-wamm

This is an n8n community node. It lets you use WAMM PRO service in your n8n workflows.

WAMM PRO is a service that enables sending WhatsApp messages directly through the WAMM API.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  

## Installation

Follow these steps to install and configure the `n8n-nodes-wamm` custom node in your n8n instance.

**Prerequisites:**
* A functional n8n instance. This node has been tested and is compatible with **n8n version 1.94.1**.
* Node.js (recommended v18.x, compatible with n8n 1.94.1) and npm installed on the server where n8n is running (necessary for compiling the node from source).

**Installation Steps:**

1.  **Download or Clone the Node Package:**
    Obtain the source code for `n8n-nodes-wamm`. If using Git:
    ```bash
    git clone https://github.com/ulmeanuadrian/n8n-nodes-wamm.git
    ```
    Navigate into the newly created directory:
    ```bash
    cd n8n-nodes-wamm
    ```

2.  **Install Dependencies and Build the Node:**
    This command installs the necessary development dependencies and compiles the TypeScript source code into JavaScript (into the `dist/` directory).
    ```bash
    npm install
    npm run build
    ```
    Ensure this step completes without errors. Any errors displayed here must be resolved before proceeding.

3.  **Prepare the Node for Your n8n Instance:**
    To ensure compatibility and avoid conflicts with n8n's internal modules, it is necessary to delete the `node_modules` directory from this custom node's package *after* the compilation (`npm run build`) has successfully completed. This step ensures that the node will use the core modules (like `n8n-core`, `n8n-workflow`) provided by your main n8n instance.
    ```bash
    rm -rf node_modules
    ```

4.  **Copy the Node to n8n's `custom` Directory:**
    Your n8n instance looks for custom nodes in the `~/.n8n/custom/` directory by default (where `~` represents the home directory of the user running n8n – e.g., `/home/adrian/.n8n/custom/`). You need to place the entire `n8n-nodes-wamm` directory (which should now contain `dist/`, `package.json`, `assets/`, etc., but **not** `node_modules/`) into this `custom` directory.

    For example, if the `n8n-nodes-wamm` directory (after steps 1-3) is located at `/home/adrian/n8n-nodes-wamm`:
    ```bash
    # Ensure the target directory exists (n8n usually creates it on first run, but it's good to check)
    mkdir -p /home/adrian/.n8n/custom/

    # Move the node's directory (or copy with 'cp -R')
    mv /home/adrian/n8n-nodes-wamm /home/adrian/.n8n/custom/
    ```
    The final structure will be: `/home/adrian/.n8n/custom/n8n-nodes-wamm/`.

5.  **Restart the n8n Service:**
    For n8n to detect and load the new custom node, you need to restart the n8n service. If you are using `systemd` (common on Linux):
    ```bash
    sudo systemctl restart n8n
    ```
    Adjust this command if you run n8n using a different method (e.g., Docker, pm2).

6.  **Verify the Installation in n8n:**
    * Open your n8n interface in your web browser.
    * Perform a hard refresh of the page (usually `Ctrl+Shift+R` or `Cmd+Shift+R` on Mac).
    * Create a new workflow or edit an existing one. Try to add a new node and search for "WAMM" (or the name specified in the node's `displayName` in its `package.json`). The node should appear in the list.
    * Check the n8n logs for any errors during startup or node loading: `sudo journalctl -u n8n -n 100 --no-pager`.

**Additional Notes and Troubleshooting:**

* **n8n Version Compatibility:** This node was tested on n8n `1.94.1`. Using it with other n8n versions may require adjustments.
* **`pkce-challenge` for OAuth2 Credentials (Specific Issue with n8n v1.94.1):**
    If, upon starting n8n or when using OAuth2 credentials (even standard n8n ones, after adding this or other custom nodes that use OAuth2), you encounter `ERR_REQUIRE_ESM` errors related to `pkce-challenge`, this indicates an issue with the internal version of `pkce-challenge` in n8n `1.94.1`. To resolve this specific issue on the original development environment, the following manual steps were necessary (these modify the main n8n installation and should be performed with caution and only if absolutely necessary):
    1.  Globally install a CommonJS version of `pkce-challenge`:
        ```bash
        sudo npm install -g pkce-challenge@2.2.0
        ```
    2.  Identify the location of n8n's internal `pkce-challenge` directory (usually `/usr/local/lib/node_modules/n8n/node_modules/pkce-challenge/`).
    3.  Delete that internal directory:
        ```bash
        sudo rm -rf /usr/local/lib/node_modules/n8n/node_modules/pkce-challenge
        ```
    4.  Create a symbolic link from n8n's internal location to the globally installed `2.2.0` version:
        ```bash
        sudo ln -s /usr/local/lib/node_modules/pkce-challenge /usr/local/lib/node_modules/n8n/node_modules/pkce-challenge
        ```
    5.  Restart n8n. **Caution:** This modification to your n8n installation may be overwritten by n8n updates and is a specific workaround for the `pkce-challenge` ESM/CJS conflict in n8n v1.94.1.

* **File Paths:** Ensure that the file structure within your `dist/` directory (after compilation) matches the paths specified in the node's `package.json` (in the `n8n` section).
* **Other Startup Errors:** If n8n fails to start after adding the node, carefully check the `sudo journalctl -u n8n -f` logs for specific errors. Issues could be related to other transitive dependencies (as was previously the case with `@azure/storage-blob`, resolved by deleting the custom node's `node_modules` after build).

## Operations

This node supports the following operations:

- **Send Message**: Send a direct text message via WhatsApp
- **Send Media & File**: Send media or files via WhatsApp
- **Send Template**: Send a template-based message via WhatsApp
- **Add to Contact List**: Add a contact to a contact list
- **Remove from Contact List**: Remove a contact from a list or all lists

## Credentials

To use this node, you need a WAMM PRO account. You can get one by visiting the [WAMM website](https://wamm.pro/).

When setting up the credentials, you'll need:
- **API Token**: The access token for the WAMM API
- **Email**: The email address associated with your WAMM account

## Compatibility

This node is compatible with n8n version 1.0.0 or later.

## Usage

### Sending WhatsApp Messages
1. Add the WAMM PRO node to your workflow
2. Select the "Send Message" operation
3. Configure your WAMM instance ID
4. Add the recipient's phone number (in international format, without +)
5. Enter the message you want to send
6. Optionally, you can schedule the message by specifying date and time

### Sending Media or Files
1. Add the WAMM PRO node to your workflow
2. Select the "Send Media & File" operation
3. Configure your WAMM instance ID
4. Add the recipient's phone number
5. Specify the URL of the media file you want to send
6. Enter the message to accompany the media file

### Using Templates
1. Add the WAMM PRO node to your workflow
2. Select the "Send Template" operation
3. Configure your WAMM instance ID
4. Add the recipient's phone number
5. Specify the template ID you want to use
6. Add the template parameters in JSON format

## Resources

* [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
* [WAMM API Documentation](https://wamm.pro/apidoc/)
* [GitHub: n8n-nodes-wamm](https://github.com/ulmeanuadrian/n8n-nodes-wamm)
